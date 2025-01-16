
import React, {useState, useEffect} from './react.js'
export default function NoteForm({ onSubmit, editingNote, onUpdate }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
    }
  }, [editingNote]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) return;

    if (editingNote) {
      onUpdate({
        id: editingNote.id,
        title: title.trim(),
        content: content.trim(),
      });
    } else {
      onSubmit({
        title: title.trim(),
        content: content.trim(),
      });
    }

    setTitle("");
    setContent("");
  };

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Note Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="note-input"
      />
      <textarea
        placeholder="Note Content"
        value={content}
        onChange={(e) => {
          console.log(e.target.value);
          setContent(e.target.value);
        }}
        className="note-textarea"
      />
      <button type="submit" className="note-button">
        {editingNote ? "Update Note" : "Add Note"}
      </button>
    </form>
  );
}
