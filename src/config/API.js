/* eslint-disable import/prefer-default-export */
const booksAPIKey = process.env.REACT_APP_BOOKS_API_KEY;
const booksAPI = 'https://www.googleapis.com/books/v1';

export const booksAPIRef = ({ q, intitle, inauthor, inpublisher, isbn, maxResults = 30, startIndex } = {}) => `${booksAPI}/volumes?q=${q}${intitle ? `+intitle:${intitle}` : ''}${inauthor ? `+inauthor:${inauthor}` : ''}${inpublisher ? `+inpublisher:${inpublisher}` : ''}${isbn ? `+isbn:${isbn}` : ''}&langRestrict=it&printType=books&key=${booksAPIKey}&maxResults=${maxResults}${startIndex ? `&startIndex=${startIndex}` : ''}`; 
// EXAMPLE: booksAPIRef({ q: 'red', intitle: 'sherlock' });