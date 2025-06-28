const serviziEserciziStudente = {
    getEsercizi: async () => {
      return [
        {
          id: 1,
          nome: 'Prova a tempo',
          immagine: 'src/assets/stopwatch-graphic-icon-design-template-png_302689-removebg-preview.png',
          tipo: 'tempo'
        },
        {
          id: 2,
          nome: 'Divisione in sillabe',
          immagine: 'src/assets/sillabe-removebg-preview.png',
          tipo: 'sillabe'
        },
        {
          id: 3,
          nome: 'Pronuncia corretta',
          immagine: 'src/assets/pronuncia-removebg-preview.png',
          tipo: 'pronuncia'
        }
      ];
    }
  };
  
  export { serviziEserciziStudente };
  