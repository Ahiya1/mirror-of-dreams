import React, { useEffect, useState } from 'react';

const ToneElements = ({ tone }) => {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    const createElements = () => {
      const newElements = [];

      if (tone === 'fusion') {
        for (let i = 0; i < 6; i++) {
          newElements.push({
            id: `fusion-${i}`,
            type: 'fusion-breath',
            style: {
              width: `${200 + Math.random() * 140}px`,
              height: `${200 + Math.random() * 140}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 4.2}s`,
              animationDuration: `${20 + Math.random() * 10}s`,
            },
          });
        }
      } else if (tone === 'gentle') {
        for (let i = 0; i < 35; i++) {
          newElements.push({
            id: `gentle-${i}`,
            type: 'gentle-star',
            style: {
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 6}s`,
            },
          });
        }
      } else if (tone === 'intense') {
        for (let i = 0; i < 7; i++) {
          newElements.push({
            id: `intense-${i}`,
            type: 'intense-swirl',
            style: {
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 3.5}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            },
          });
        }
      }

      setElements(newElements);
    };

    createElements();
  }, [tone]);

  return (
    <div className="tone-elements">
      {elements.map((element) => (
        <div
          key={element.id}
          className={element.type}
          style={element.style}
        />
      ))}
    </div>
  );
};

export default ToneElements;