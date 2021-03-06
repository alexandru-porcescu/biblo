import { Tooltip } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar';
import Grow from '@material-ui/core/Grow';
import React, { forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { notesRef, reviewerCommenterRef } from '../config/firebase';
import icon from '../config/icons';
import { abbrNum, getInitials, handleFirestoreError, hasRole, normURL, timeSince, truncateString } from '../config/shared';
import { commentType, stringType } from '../config/types';
import SnackbarContext from '../context/snackbarContext';
import UserContext from '../context/userContext';
import FlagDialog from './flagDialog';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

const Transition = forwardRef((props, ref) => <Grow {...props} ref={ref} /> );

const Comment = props => {
  const { user } = useContext(UserContext);
  const { openSnackbar } = useContext(SnackbarContext);
  const { bid, comment, onEdit, reviewerDisplayName, rid } = props;
  const likes_num = comment.likes ? comment.likes.length : 0;
  // const dislikes_num = comment.dislikes ? comment.dislikes.length : 0;
  const [flagLoading, setFlagLoading] = useState(false);
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const [isOpenFlagDialog, setIsOpenFlagDialog] = useState(false);
  const [like, setLike] = useState(likes_num && comment.likes.indexOf(user && user.uid) > -1 ? true : false || false);
  const is = useRef(true);

  useEffect(() => () => {
    is.current = false;
  }, []);

  const onThumbChange = useCallback(() => {
    let { likes } = comment;
    
    if (user) {
      if (like) {
        likes = likes.filter(e => e !== user.uid);
        if (is.current) setLike(false);
        // console.log(`User ${user.uid} remove like on comment ${bid}/${comment.createdByUid}`);
      } else {
        likes = [...likes, user.uid];
        if (is.current) setLike(true);
        // console.log(`User ${user.uid} add like on comment ${bid}/${comment.createdByUid}`);

        const likerURL = `/dashboard/${user.uid}`;
        const likerDisplayName = truncateString(user.displayName.split(' ')[0], 12);
        const reviewerURL = `/dashboard/${rid}`;
        const reviewer = truncateString(reviewerDisplayName.split(' ')[0], 12);
        const bookTitle = truncateString(comment.bookTitle, 35);
        const bookURL = `/book/${bid}/${normURL(comment.bookTitle)}`;
        const isLikerReviewer = user.uid === rid;
        const noteMsg = `<a href="${likerURL}">${likerDisplayName}</a> ha messo mi piace alla tua risposta alla ${isLikerReviewer ? 'sua recensione' : `recensione di <a href="${reviewerURL}">${reviewer}</a>`} del libro <a href="${bookURL}">${bookTitle}</a>`;
        const newNoteRef = notesRef(comment.createdByUid).doc();
        
        newNoteRef.set({
          nid: newNoteRef.id,
          text: noteMsg,
          created_num: Date.now(),
          createdBy: user.displayName,
          createdByUid: user.uid,
          photoURL: user.photoURL,
          tag: ['like'],
          read: false,
          uid: comment.createdByUid
        }).catch(err => openSnackbar(handleFirestoreError(err), 'error'));
      }
    }

    if (bid && comment.createdByUid && rid) {
      reviewerCommenterRef(bid, rid, comment.createdByUid).update({ likes }).then(() => {
        // console.log(`Comment likes updated`);
      }).catch(err => openSnackbar(handleFirestoreError(err), 'error'));
    } else console.warn('No bid or cid');
  }, [bid, comment, like, openSnackbar, reviewerDisplayName, rid, user]);

  const onFlagRequest = () => setIsOpenFlagDialog(true);

  const onCloseFlagDialog = () => setIsOpenFlagDialog(false);

  const onFlag = useCallback(value => {
    if (user) {
      const flag = {
        value,
        flaggedByUid: user.uid,
        flagged_num: Date.now()
      };
  
      if (bid && comment && rid) {
        if (is.current) setFlagLoading(true);
        reviewerCommenterRef(bid, rid, comment.createdByUid).update({ flag }).then(() => {
          if (is.current) {
            setFlagLoading(false);
            setIsOpenFlagDialog(false);
            openSnackbar('Risposta segnalata agli amministratori', 'success');
          }
        }).catch(err => openSnackbar(handleFirestoreError(err), 'error'));
      } else console.warn('Cannot flag');
    }
  }, [bid, comment, openSnackbar, rid, user]);

  const onDelete = () => {
    if (bid) {
      reviewerCommenterRef(bid, rid, comment.createdByUid).delete().then(() => {
        // console.log(`Comment deleted`);
        openSnackbar('Risposta cancellata', 'success');
      }).catch(err => openSnackbar(handleFirestoreError(err), 'error'));
    } else console.warn(`No bid`);
  };

  const onOpenActionsMenu = e => setActionsAnchorEl(e.currentTarget);

  const onCloseActionsMenu = () => setActionsAnchorEl(null);

  const isOwner = useMemo(() => comment.createdByUid === (user && user.uid), [comment, user]);
  const isAdmin = useMemo(() => hasRole(user, 'admin'), [user]);
  const isEditor = useMemo(() => hasRole(user, 'editor'), [user]);
  const flaggedByUser = useMemo(() => (comment.flag && comment.flag.flaggedByUid) === (user && user.uid), [comment, user]);
  const classNames = useMemo(() => `${isOwner ? 'own comment' : 'comment'} ${comment.flag ? `flagged ${comment.flag.value}` : ''}`, [comment, isOwner]);

  return (
    <>
      
      <div className={classNames} id={`${rid}-${comment.createdByUid}`} ref={is}>
        <div className="row">
          <div className="col-auto left">
            <Link to={`/dashboard/${comment.createdByUid}`}>
              <Avatar className="avatar" src={comment.photoURL} alt={comment.displayName}>{!comment.photoURL && getInitials(comment.displayName)}</Avatar>
            </Link>
          </div>
          <div className="col right">
            <div className="head row">
              <Link to={rid ? `/book/${comment.bid}/${normURL(comment.bookTitle)}` : `/dashboard/${comment.createdByUid}`} className="col author">
                <h3>{comment.displayName}</h3>
              </Link>
              {isEditor && (
                <div className="col-auto">
                  <button
                    className="btn sm flat rounded icon"
                    onClick={Boolean(actionsAnchorEl) ? onCloseActionsMenu : onOpenActionsMenu}>
                    {Boolean(actionsAnchorEl) ? icon.close : icon.dotsVertical}
                  </button>
                  <Menu
                    id="actions-menu"
                    className="dropdown-menu"
                    anchorEl={actionsAnchorEl}
                    onClick={onCloseActionsMenu}
                    open={Boolean(actionsAnchorEl)}
                    onClose={onCloseActionsMenu}>
                    {isOwner ? <MenuItem onClick={onEdit}>Modifica</MenuItem> : <MenuItem onClick={onFlagRequest}>Segnala</MenuItem>}
                    {(isOwner || isAdmin) && <MenuItem onClick={onDelete}>Elimina</MenuItem>}
                  </Menu>
                </div>
              )}
            </div>
            <div className="info-row text">{comment.text}</div>
            {bid && 
              <div className="foot row">
                <div className="col-auto likes">
                  <div className="counter">
                    <Tooltip title={like ? 'Annulla mi piace' : 'Mi piace'}>
                      <span>
                        <button 
                          type="button"
                          className={`btn flat thumb up ${like}`} 
                          disabled={!isEditor || isOwner} 
                          onClick={onThumbChange}>
                          {icon.thumbUp} {abbrNum(likes_num)}
                        </button>
                      </span>
                    </Tooltip>
                  </div>
                  {/* 
                    <div className="counter">
                      <Tooltip title={dislike ? 'Annulla mi piace' : 'Mi piace'}>
                        <span>
                          <button 
                            type="button"
                            className={`btn flat thumb down ${dislike}`} 
                            disabled={!isEditor || isOwner} 
                            onClick={onThumbChange}>
                            {icon.thumbDown} {abbrNum(dislikes_num)}
                          </button>
                        </span>
                      </Tooltip>
                    </div> 
                  */}
                </div>
                <div className="col counter text-right date">{timeSince(comment.created_num)}</div>
              </div>
            }
          </div>
        </div>
      </div>

      {isOpenFlagDialog && (
        <FlagDialog 
          loading={flagLoading}
          open={isOpenFlagDialog} 
          onClose={onCloseFlagDialog} 
          onFlag={onFlag} 
          TransitionComponent={Transition} 
          value={flaggedByUser ? comment.flag && comment.flag.value : ''}
        />
      )}
    </>
  );
}

Comment.propTypes = {
  bid: stringType.isRequired,
  comment: commentType.isRequired,
  reviewerDisplayName: stringType.isRequired,
  rid: stringType.isRequired
}

export default Comment;