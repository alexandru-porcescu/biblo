import React from 'react';
import { Link } from 'react-router-dom';
import { reviewType } from '../config/types';
import { timeSince } from '../config/shared';
import Rating from './rating';
import Avatar from './avatar';
import { icon } from '../config/icons';
  
const Review = props => (
  <div className="review">
    <div className="row">
      <Link to={`/dashboard/${props.review.createdByUid}`} className="col-auto left">
        <Avatar src={props.review.avatarURL} alt={props.review.createdBy} />
      </Link>
      <div className="col right">
        <div className="head row">
          <Link to={`/dashboard/${props.review.createdByUid}`} className="col-auto author">
            <h3>{props.review.createdBy}</h3>
          </Link>
          <div className="col text-align-right rating"><Rating ratings={{rating_num: props.review.rating_num}} /></div>
        </div>
        {props.review.title && <h4 className="title">{props.review.title}</h4>}
        <p className="text">{props.review.text}</p>
        <div className="foot row">
          <div className="col-auto likes">
            <button className={`link flat like ${props.review.like}`}>{icon.thumbUp()}</button> {props.review.likes_num} Like
          </div>
          <div className="col text-align-right date">{timeSince(props.review.created_num)}</div>
        </div>
      </div>
    </div>
  </div>
);

Review.propTypes = {
  review: reviewType.isRequired
}

export default Review;