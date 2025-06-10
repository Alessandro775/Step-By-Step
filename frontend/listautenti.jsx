import React, { useEffect, useState } from 'react';

function ListaUtenti() {
  const [utenti, setUtenti] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/educatore')
      .then(res => res.json())
      .then(data => setUtenti(data));
  }, []);

  return (
    <ul>
      {utenti.map(u => (
        <li key={u.id}>{u.nome}</li>
      ))}
    </ul>
  );
}

export default ListaUtenti;
