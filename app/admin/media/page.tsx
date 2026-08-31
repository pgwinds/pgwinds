export const metadata = { title: "Admin · Media" };

import { uploadMedia } from "@/lib/actions/admin";

export default function AdminMediaPage() { return <><header className="admin-page-header"><p className="eyebrow">Library</p><h1>Media</h1><p>Upload reusable public images with accessible descriptions.</p></header><form className="admin-editor" action={uploadMedia}><label className="admin-editor__wide">Image<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label><label className="admin-editor__wide">Alt text<input name="altText" required /></label><label className="admin-editor__wide">Caption (optional)<textarea name="caption" rows={4} /></label><p className="admin-editor__wide admin-help">JPG, PNG, or WebP only. Maximum file size: 8 MB.</p><button className="button" type="submit">Upload image</button></form></>; }
