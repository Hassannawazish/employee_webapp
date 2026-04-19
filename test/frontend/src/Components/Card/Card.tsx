import React from 'react'
import "./Card.css";

type Props = {}

const Card = (props: Props) => {
  return <div className='card'>
        <img
            src="https://cdn.mos.cms.futurecdn.net/g3k8sf4sNtXPpTeevjoKEW-650-80.jpg.webp"
            alt="Image"
        />
        <div className="details">
            <h2>AAPL</h2>
            <p>$110</p>
        </div>
        <p className='infon'>official key products</p>
    </div>;
};

export default Card