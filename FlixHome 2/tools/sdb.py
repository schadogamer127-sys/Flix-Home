"""Minimal pure-Python client for Samsung's Smart Development Bridge (sdb).

sdb is a fork of Android's adb wire protocol. Talking to the TV directly over
TCP 26101 means no Tizen Studio, no x86-only binaries and no local sdb server.
Protocol details follow Samsung's sdb and the MIT-licensed TizenSdb.Core client.

Retail TVs only accept a handful of shell verbs ("0 vd_applist",
"0 vd_appuninstall <pkgid>", "0 was_execute <appid>", "0 getduid", ...) and
only from the Host PC IP set in the TV's Developer Mode dialog.
"""

import socket
import struct
import time

PORT = 26101
VERSION = 0x01000000
MAX_DATA = 256 * 1024

CNXN, AUTH, OPEN, OKAY, WRTE, CLSE = (
    struct.unpack("<I", c)[0] for c in (b"CNXN", b"AUTH", b"OPEN", b"OKAY", b"WRTE", b"CLSE")
)
NAMES = {CNXN: "CNXN", AUTH: "AUTH", OPEN: "OPEN", OKAY: "OKAY", WRTE: "WRTE", CLSE: "CLSE"}


class SdbError(Exception):
    pass


class Sdb:
    def __init__(self, host, port=PORT, timeout=15):
        self.host, self.port, self.timeout = host, port, timeout
        self.sock = None
        self.banner = ""
        self.max_data = 4096
        self._next_id = 1

    # -- framing -------------------------------------------------------------
    def _send(self, cmd, arg0, arg1, payload=b""):
        header = struct.pack(
            "<6I", cmd, arg0, arg1, len(payload), sum(payload) & 0xFFFFFFFF, cmd ^ 0xFFFFFFFF
        )
        self.sock.sendall(header + payload)

    def _recv_exact(self, n):
        buf = b""
        while len(buf) < n:
            chunk = self.sock.recv(n - len(buf))
            if not chunk:
                raise SdbError("connection closed by TV")
            buf += chunk
        return buf

    def _recv(self):
        cmd, arg0, arg1, length, _checksum, magic = struct.unpack("<6I", self._recv_exact(24))
        if magic != cmd ^ 0xFFFFFFFF:
            raise SdbError(f"bad frame magic for {cmd:#x}")
        return cmd, arg0, arg1, self._recv_exact(length) if length else b""

    # -- session -------------------------------------------------------------
    def connect(self, attempts=3):
        # The TV sometimes resets a handshake that arrives right after a previous
        # session closed; a short retry gets through.
        for attempt in range(attempts):
            try:
                return self._connect_once()
            except (SdbError, OSError) as e:
                self.close()
                if attempt == attempts - 1:
                    if isinstance(e, SdbError):
                        raise
                    raise SdbError(str(e)) from e
                time.sleep(2)

    def _connect_once(self):
        try:
            self.sock = socket.create_connection((self.host, self.port), timeout=self.timeout)
        except OSError as e:
            raise SdbError(
                f"cannot reach {self.host}:{self.port} ({e}). "
                "Is Developer Mode on, with this computer's IP, and was the TV restarted?"
            ) from e
        self._send(CNXN, VERSION, MAX_DATA, b"host::aerotizen\0")
        try:
            cmd, _arg0, arg1, payload = self._recv()
        except (SdbError, OSError) as e:
            raise SdbError(
                "TV closed the connection during handshake. Usually the Developer Mode "
                "Host PC IP doesn't match this computer, or the TV wasn't restarted."
            ) from e
        if cmd == AUTH:
            raise SdbError("TV asked for key authentication, which this client doesn't support yet.")
        if cmd != CNXN:
            raise SdbError(f"unexpected handshake reply {NAMES.get(cmd, hex(cmd))}")
        self.max_data = min(MAX_DATA, arg1 or MAX_DATA)
        self.banner = payload.decode(errors="replace").strip("\0")
        return self

    def close(self):
        if self.sock:
            self.sock.close()
            self.sock = None

    def __enter__(self):
        return self.connect()

    def __exit__(self, *exc):
        self.close()

    # -- services ------------------------------------------------------------
    def service(self, name):
        """Open a stream to `name` (e.g. "shell:0 vd_applist") and return all output."""
        local_id = self._next_id
        self._next_id += 1
        self._send(OPEN, local_id, 0, name.encode() + b"\0")
        out = bytearray()
        remote_id = None
        while True:
            cmd, arg0, arg1, payload = self._recv()
            if arg1 != local_id:
                continue
            if cmd == OKAY:
                remote_id = arg0
            elif cmd == WRTE:
                out += payload
                self._send(OKAY, local_id, arg0)
            elif cmd == CLSE:
                if remote_id is not None:
                    self._send(CLSE, local_id, arg0)
                return out.decode(errors="replace")

    def push(self, data, remote_path):
        """Upload bytes to remote_path using the adb-style sync protocol."""
        local_id = self._next_id
        self._next_id += 1
        self._send(OPEN, local_id, 0, b"sync:\0")
        remote_id = None
        while remote_id is None:
            cmd, arg0, arg1, _payload = self._recv()
            if arg1 != local_id:
                continue
            if cmd == CLSE:
                raise SdbError("TV refused the file transfer")
            if cmd == OKAY:
                remote_id = arg0

        def write(chunk):
            self._send(WRTE, local_id, remote_id, chunk)
            while True:  # each WRTE must be acknowledged before the next
                cmd, _arg0, arg1, _p = self._recv()
                if arg1 == local_id and cmd == OKAY:
                    return
                if arg1 == local_id and cmd == CLSE:
                    raise SdbError("TV closed the file transfer")

        def packet(tag, payload):
            return tag + struct.pack("<I", len(payload)) + payload

        path = remote_path.encode()
        write(packet(b"SEND", path))
        for i in range(0, len(data), 64 * 1024):
            write(packet(b"DATA", data[i : i + 64 * 1024]))
        write(packet(b"DONE", struct.pack("<I", int(time.time()))))

        reply = b""
        while len(reply) < 8:
            cmd, arg0, arg1, payload = self._recv()
            if arg1 != local_id:
                continue
            if cmd == WRTE:
                reply += payload
                self._send(OKAY, local_id, arg0)
            elif cmd == CLSE:
                break
        self._send(CLSE, local_id, remote_id)
        if reply[:4] != b"OKAY":
            raise SdbError(f"upload failed: {reply[8:].decode(errors='replace') or reply!r}")

    def _sync(self, request, path):
        """Run one sync request (LIST or RECV) and return the raw reply stream."""
        local_id = self._next_id
        self._next_id += 1
        self._send(OPEN, local_id, 0, b"sync:\0")
        remote_id, buf, done = None, bytearray(), False
        while remote_id is None:
            cmd, arg0, arg1, _p = self._recv()
            if arg1 == local_id and cmd == OKAY:
                remote_id = arg0
            elif arg1 == local_id and cmd == CLSE:
                raise SdbError("TV refused sync")
        p = path.encode()
        self._send(WRTE, local_id, remote_id, request + struct.pack("<I", len(p)) + p)
        while not done:
            cmd, arg0, arg1, payload = self._recv()
            if arg1 != local_id:
                continue
            if cmd == WRTE:
                buf += payload
                self._send(OKAY, local_id, arg0)
                done = self._sync_complete(buf, request)
            elif cmd == CLSE:
                break
        self._send(WRTE, local_id, remote_id, b"QUIT" + struct.pack("<I", 0))
        self._send(CLSE, local_id, remote_id)
        return bytes(buf)

    @staticmethod
    def _sync_complete(buf, request):
        i = 0
        while i + 8 <= len(buf):
            tag = buf[i : i + 4]
            if request == b"LIST":
                if tag == b"DONE":
                    return True
                if tag != b"DENT" or i + 20 > len(buf):
                    return tag == b"FAIL"
                (namelen,) = struct.unpack("<I", buf[i + 16 : i + 20])
                i += 20 + namelen
            else:
                (n,) = struct.unpack("<I", buf[i + 4 : i + 8])
                if tag in (b"DONE", b"FAIL"):
                    return True
                i += 8 + n
        return False

    def listdir(self, path):
        buf, out, i = self._sync(b"LIST", path), [], 0
        while i + 20 <= len(buf) and buf[i : i + 4] == b"DENT":
            mode, size, _mtime, namelen = struct.unpack("<4I", buf[i + 4 : i + 20])
            name = buf[i + 20 : i + 20 + namelen].decode(errors="replace")
            if name not in (".", ".."):
                out.append((name, size, mode))
            i += 20 + namelen
        return out

    def pull(self, path):
        buf, data, i = self._sync(b"RECV", path), bytearray(), 0
        while i + 8 <= len(buf):
            tag, (n,) = buf[i : i + 4], struct.unpack("<I", buf[i + 4 : i + 8])
            if tag == b"DATA":
                data += buf[i + 8 : i + 8 + n]
            elif tag == b"FAIL":
                raise SdbError(buf[i + 8 : i + 8 + n].decode(errors="replace"))
            elif tag == b"DONE":
                break
            i += 8 + n
        return bytes(data)

    def forward(self, local_port, remote_port):
        """Serve localhost:local_port, tunnelling each connection to the TV's remote_port.

        The TV accepts only one sdb connection at a time, so every tunnelled stream is
        multiplexed over this one; a single reader thread routes frames by stream id.
        Blocks forever.
        """
        import threading

        send_lock = threading.Lock()
        streams = {}  # local id -> {"client", "rid", "acked", "opened"}

        def send(cmd, a0, a1, payload=b""):
            with send_lock:
                self._send(cmd, a0, a1, payload)

        def reader():
            while True:
                cmd, a0, a1, payload = self._recv()
                st = streams.get(a1)
                if st is None:
                    continue
                if cmd == OKAY:
                    if st["rid"] is None:
                        st["rid"] = a0
                        st["opened"].set()
                    st["acked"].set()
                elif cmd == WRTE:
                    try:
                        st["client"].sendall(payload)
                    except OSError:
                        pass
                    send(OKAY, a1, a0)
                elif cmd == CLSE:
                    st["opened"].set()
                    streams.pop(a1, None)
                    try:
                        st["client"].close()
                    except OSError:
                        pass

        def serve(client):
            with send_lock:
                lid = self._next_id
                self._next_id += 1
            st = {"client": client, "rid": None, "acked": threading.Event(), "opened": threading.Event()}
            streams[lid] = st
            send(OPEN, lid, 0, f"tcp:{remote_port}\0".encode())
            st["opened"].wait(15)
            if st["rid"] is None:
                client.close()
                return
            st["acked"].set()
            try:
                while True:
                    data = client.recv(self.max_data - 64)
                    if not data:
                        break
                    st["acked"].wait()
                    st["acked"].clear()
                    if lid not in streams:
                        break
                    send(WRTE, lid, st["rid"], data)
            except OSError:
                pass
            if streams.pop(lid, None) is not None:
                send(CLSE, lid, st["rid"])

        self.sock.settimeout(None)
        threading.Thread(target=reader, daemon=True).start()
        server = socket.socket()
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(("127.0.0.1", local_port))
        server.listen(8)
        while True:
            client, _addr = server.accept()
            threading.Thread(target=serve, args=(client,), daemon=True).start()

    def debug_launch(self, app_id):
        """Launch an app with the web inspector enabled; returns the inspector port."""
        # The TV keeps this stream open, so read until the port appears rather than to EOF.
        import re

        lid = self._next_id
        self._next_id += 1
        self._send(OPEN, lid, 0, f"shell:0 debug {app_id}\0".encode())
        out = b""
        while True:
            cmd, a0, a1, payload = self._recv()
            if a1 != lid:
                continue
            if cmd == WRTE:
                out += payload
                self._send(OKAY, lid, a0)
                m = re.search(rb"port\s*:\s*(\d+)", out)
                if m:
                    return int(m.group(1))
            elif cmd == CLSE:
                raise SdbError(f"debug launch failed: {out.decode(errors='replace').strip()[-200:]}")

    def install(self, app_id, wgt_bytes, tool_path):
        remote = f"{tool_path}/{app_id.split('.')[0]}.wgt"
        self.push(wgt_bytes, remote)
        return self.shell(f"0 vd_appinstall {app_id} {remote}")

    def shell(self, command):
        return self.service(f"shell:{command}")

    def capability(self):
        caps = {}
        for line in self.service("capability:").splitlines():
            if ":" in line:
                key, value = line.split(":", 1)
                caps[key.strip(" \x00�")] = value.strip()
        return caps

    def applist(self):
        return self.shell("0 vd_applist")

    def uninstall(self, pkgid):
        return self.shell(f"0 vd_appuninstall {pkgid}")

    def launch(self, appid):
        return self.shell(f"0 was_execute {appid}")

    def duid(self):
        return self.shell("0 getduid").strip()
