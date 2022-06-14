import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Axios from 'axios';
import AnimalCard from './components/AnimalCard';
import CreateNewForm from './components/CreateNewForm';

const App = () => {
  const [animals, setAnimals] = useState([]);

  useEffect(() => {
    (async () => {
      const response = await Axios.get('/api/animals');
      setAnimals(response.data);
      console.log(response.data);
    })();
  }, []);

  return (
    <div className="container mt-3">
      <p>
        <a href="/">&laquo; back to public homepage</a>
      </p>
      <CreateNewForm setAnimals={setAnimals} />
      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3">
        {animals.map(animal => (
          <div className="mb-3">
            <AnimalCard
              name={animal.name}
              species={animal.species}
              photo={animal.photo}
              id={animal._id}
              key={animal._id}
              setAnimals={setAnimals}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const root = createRoot(document.querySelector('#app'));
root.render(<App />);
