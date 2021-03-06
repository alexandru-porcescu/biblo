import React from 'react';
import { Helmet } from 'react-helmet-async';
import { app } from '../../config/shared';
import BooksRowDivider from '../booksRowDivider';
import withScrollToTop from '../hocs/withScrollToTop';

const HelpPage = () => (
  <div id="HelpPageComponent" className="reveal fadeIn slideUp">
    <Helmet>
      <title>{app.name} | Aiuto</title>
      <meta name="description" content={app.desc} />
      <link rel="canonical" href={app.url} />
    </Helmet>
    <div className="container pad-v">
      <h1>Aiuto</h1>
      <div className="text-justify text-left-sm">
        <p>Questa pagina &egrave; in preparazione...</p>
        
        <BooksRowDivider />

        <p>Se hai bisogno di aiuto scrivici all&apos;indirizzo <a href={`mailto:${app.email}?subject=Biblo: aiuto`}>{app.email}</a>.</p>
      </div>
    </div>
  </div>
);

export default withScrollToTop(HelpPage);