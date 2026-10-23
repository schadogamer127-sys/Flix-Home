"""Sign a Tizen web app (.wgt) with author + distributor certificates.

Implements the W3C widget digital-signature profile the TV verifies:
author-signature.xml covers every file, signature1.xml covers every file plus
the author signature. RSA-SHA512 over exclusive-C14N SignedInfo, SHA-512 digests.
The XML is emitted directly in canonical form, so no C14N library is needed.
Structure follows the MIT-licensed TizenSdb.Core signer.
"""

import base64
import hashlib
import io
import os
import urllib.parse
import zipfile

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import pkcs12

DSIG = "http://www.w3.org/2000/09/xmldsig#"
DSP = "http://www.w3.org/2009/xmldsig-properties"
SIG_FILES = ("author-signature.xml", "signature1.xml")


def _esc(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\r", "&#xD;")


def _attr(text):
    return _esc(text).replace('"', "&quot;").replace("\t", "&#x9;").replace("\n", "&#xA;")


def _b64(data):
    return base64.b64encode(data).decode()


def _prop_object(sig_id, with_ns):
    role = "author" if sig_id == "AuthorSignature" else "distributor"
    ns = f' xmlns="{DSIG}"' if with_ns else ""

    def prop(pid, name, uri):
        uri_attr = f' URI="{uri}"' if uri else ""
        return (
            f'<SignatureProperty Id="{pid}" Target="#{sig_id}">'
            f"<dsp:{name}{uri_attr}></dsp:{name}></SignatureProperty>"
        )

    return (
        f'<Object{ns} Id="prop"><SignatureProperties xmlns:dsp="{DSP}">'
        + prop("profile", "Profile", "http://www.w3.org/ns/widgets-digsig#profile")
        + prop("role", "Role", f"http://www.w3.org/ns/widgets-digsig#role-{role}")
        + prop("identifier", "Identifier", None)
        + "</SignatureProperties></Object>"
    )


def _signed_info(files, prop_digest, with_ns):
    ns = f' xmlns="{DSIG}"' if with_ns else ""
    refs = "".join(
        f'<Reference URI="{_attr(urllib.parse.quote(name, safe="/"))}">'
        f'<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha512"></DigestMethod>'
        f"<DigestValue>{_b64(hashlib.sha512(data).digest())}</DigestValue></Reference>"
        for name, data in files
    )
    return (
        f"<SignedInfo{ns}>"
        '<CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod>'
        '<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha512"></SignatureMethod>'
        + refs
        + '<Reference URI="#prop"><Transforms>'
        '<Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"></Transform></Transforms>'
        '<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha512"></DigestMethod>'
        f"<DigestValue>{prop_digest}</DigestValue></Reference></SignedInfo>"
    )


def _wrap76(s):
    return "\n".join(s[i : i + 76] for i in range(0, len(s), 76))


def _signature(sig_id, files, key, chain):
    # As a standalone subtree each element carries the inherited default namespace,
    # which is exactly what C14N of the in-document element produces.
    prop_digest = _b64(hashlib.sha512(_prop_object(sig_id, True).encode()).digest())
    signed_info = _signed_info(files, prop_digest, True).encode()
    sig = key.sign(signed_info, padding.PKCS1v15(), hashes.SHA512())
    certs = "".join(
        f"<X509Certificate>\n{_wrap76(_b64(c.public_bytes(serialization.Encoding.DER)))}\n</X509Certificate>"
        for c in chain
    )
    return (
        f'<Signature xmlns="{DSIG}" Id="{sig_id}">'
        + _signed_info(files, prop_digest, False)
        + f"<SignatureValue>{_b64(sig)}</SignatureValue>"
        + f"<KeyInfo><X509Data>{certs}</X509Data></KeyInfo>"
        + _prop_object(sig_id, False)
        + "</Signature>"
    ).encode()


def _load_p12(path, password):
    with open(path, "rb") as f:
        key, cert, extra = pkcs12.load_key_and_certificates(f.read(), password.encode())
    chain = [cert] + [c for c in extra if c.subject != c.issuer]
    return key, chain


def sign_wgt(src_dir_or_wgt, out_path, cert_dir):
    """Sign a directory or an existing .wgt and write a signed .wgt to out_path."""
    with open(os.path.join(cert_dir, "password.txt")) as f:
        password = f.read().strip()
    author_key, author_chain = _load_p12(os.path.join(cert_dir, "author.p12"), password)
    dist_key, dist_chain = _load_p12(os.path.join(cert_dir, "distributor.p12"), password)

    files = []
    if os.path.isdir(src_dir_or_wgt):
        for root, _dirs, names in os.walk(src_dir_or_wgt):
            for n in sorted(names):
                full = os.path.join(root, n)
                rel = os.path.relpath(full, src_dir_or_wgt).replace(os.sep, "/")
                if rel in SIG_FILES or n.startswith(".") or rel.startswith(".sign/"):
                    continue
                with open(full, "rb") as f:
                    files.append((rel, f.read()))
    else:
        with zipfile.ZipFile(src_dir_or_wgt) as z:
            for info in z.infolist():
                if info.is_dir() or info.filename.lower().endswith(SIG_FILES):
                    continue
                files.append((info.filename, z.read(info)))
    files.sort(key=lambda f: f[0])

    author = _signature("AuthorSignature", files, author_key, author_chain)
    dist = _signature(
        "DistributorSignature", [("author-signature.xml", author), *files], dist_key, dist_chain
    )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("author-signature.xml", author)
        z.writestr("signature1.xml", dist)
        for name, data in files:
            z.writestr(name, data)
    with open(out_path, "wb") as f:
        f.write(buf.getvalue())
    return out_path
