import React,{ render, useState, useEffect } from "./react.js";
import NoteForm from "./NoteForm.jsx";
function NotesList({ notes, onDelete, onEdit }) {
  if (notes.length === 0) {
    return <p className="no-notes">No notes yet. Add one!</p>;
  }

  return (
    <div className="notes-list">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

function NoteItem({ note, onDelete, onEdit }) {
  return (
    <div className="note-item">
      <h3>{note.title}</h3>
      <p>{note.content}</p>
      <div className="note-actions">
        <button onClick={() => onEdit(note)} className="edit-button">
          ✏️ Edit
        </button>
        <button onClick={() => onDelete(note.id)} className="delete-button">
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

function App() {
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);

  // Add new note
  const addNote = (note) => {
    setNotes([...notes, { ...note, id: Date.now() }]);
  };

  // Delete note
  const deleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  // Update note
  const updateNote = (updatedNote) => {
    setNotes(
      notes.map((note) => (note.id === updatedNote.id ? updatedNote : note))
    );
    setEditingNote(null);
  };

  // Set note for editing
  const editNote = (note) => {
    setEditingNote(note);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Notes App</h1>
      </header>
      <main className="app-main">
        <NoteForm
          onSubmit={addNote}
          editingNote={editingNote}
          onUpdate={updateNote}
        />
        <NotesList notes={notes} onDelete={deleteNote} onEdit={editNote} />
      </main>
    </div>
  );
}

render(<App />, document.getElementById("root"));