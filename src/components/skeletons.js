import React from 'react';

export const skltn_shelfRow = <div className="skltn shelf-row">{[...Array(7)].map((e, i) => <div key={i} className="skltn book"></div>)}</div>;