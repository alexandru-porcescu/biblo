import MomentUtils from '@date-io/moment';
import Avatar from '@material-ui/core/Avatar';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import moment from 'moment';
import 'moment/locale/it';
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import firebase, { authid, storageRef, userRef } from '../../config/firebase';
import { icon } from '../../config/icons';
import { continents, europeanCountries, italianProvinces, languages, northAmericanCountries } from '../../config/lists';
import { app, calcAge, getInitials, validateImg } from '../../config/shared';

export default class Profile extends React.Component {
	state = {
    user: null,
    imgPreview: null,
    imgProgress: 0,
    loading: true,
    changes: false,
    success: false,
    errors: {},
    authError: ''
  }

	componentDidMount() {
    this._isMounted = true;
		this.unsubUserFetch = userRef(authid).onSnapshot(snap => {
			if (snap.exists) {
				this.setState({ 
					user: snap.data(),
          imgPreview: snap.data().photoURL || '',
          loading: false
				});
			} else {
				this.setState({ loading: false });
			}
		});
  }
  
  componentWillUnmount() {
    this._isMounted = false;
    this.unsubUserFetch && this.unsubUserFetch();
  }

	onChange = e => {
    if (this._isMounted) {
      this.setState({ 
        success: false, changes: true, 
        user: { ...this.state.user, [e.target.name]: e.target.value }, 
        errors: { ...this.state.errors, [e.target.name]: null } 
      });
    }
	};

	onChangeDate = key => date => {
    if (this._isMounted) {
      this.setState({ 
        success: false, changes: true, 
        user: { ...this.state.user, [key]: String(date) }, 
        errors: { ...this.state.errors, [key]: null } 
      });
    }
  };

	onChangeSelect = key => e => {
    if (this._isMounted) {
      this.setState({ 
        success: false, changes: true, 
        user: { ...this.state.user, [key]: e.target.value },
        errors: { ...this.state.errors, [key]: null } 
      });
    }
	};

	onSubmit = e => {
		e.preventDefault();
		const errors = this.validate(this.state.user);
		if (this._isMounted) this.setState({ errors });
		if (Object.keys(errors).length === 0) {
      if (this._isMounted) this.setState({ loading: true });
			userRef(authid).set({
				...this.state.user,
				photoURL: this.state.imgPreview || '',
				sex: this.state.user.sex || '',
				birth_date: this.state.user.birth_date || '',
				city: this.state.user.city || '',
				country: this.state.user.country || ''
			}).then(() => {
        if (this._isMounted) {
          this.setState({ 
            imgProgress: 0,
            loading: false,
            changes: false,
            success: true
          }, () => this.props.openSnackbar('Modifiche salvate', 'success'));
        }
				// this.setState({ redirectToReferrer: true });
			}).catch(err => {
        if (this._isMounted) {
          this.setState({
            authError: err.message,
            loading: false
          }, () => this.props.openSnackbar(err.message));
        }
			});
		} else this.props.openSnackbar('Ricontrolla i dati inseriti', 'error');
	};

	validate = user => {
		const errors = {};
    if (!user.displayName) errors.displayName = "Inserisci un nome utente";
    if (Date(user.birth_date) > new Date()) { 
      errors.birth_date = "Data di nascita non valida" 
    } else if (calcAge(user.birth_date) < 13) { 
      errors.birth_date = "Età minima 14 anni"; 
    } else if (calcAge(user.birth_date) > 119) {
      errors.birth_date = "E chi sei.. Matusalemme?"; 
    }
		if (user.city && user.city.length > 150) errors.city = "Lunghezza massima 150 caratteri";
		return errors;
	};

	onImageChange = e => {
    e.preventDefault();
    const { openSnackbar } = this.props;
		const file = e.target.files[0];
		// console.log(file);
    const errors = validateImg(file, 1);
    if (this._isMounted) this.setState({ errors });
		if (Object.keys(errors).length === 0) {
      const uploadTask = storageRef(`users/${authid}`, 'avatar').put(file);
      // console.log(uploadTask);
			uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, snap => {
        if (this._isMounted) {
          this.setState({
            imgProgress: (snap.bytesTransferred / snap.totalBytes) * 100
          });
        }
			}, error => {
        console.warn(`Upload error: ${error.message}`);
        if (this._isMounted) {
          this.setState({ errors: { ...errors, upload: error.message } }, () => openSnackbar(error.message, 'error'));
        }
			}, () => {
        // console.log('upload completed');
        uploadTask.then(snap => {
          snap.ref.getDownloadURL().then(url => {
            if (this._isMounted) {
              this.setState({
                imgPreview: url,
                changes: true,
                success: false
              }, () => openSnackbar('Immagine caricata', 'success'));
            }
          });
        });
			});
		} else openSnackbar(errors.upload, 'error');
	};

	render() {
		const { changes, errors, imgPreview, loading, imgProgress, success, user } = this.state;
		// const menuItemsMap = arr => arr.map(item => <MenuItem value={item.id} key={item.id} primaryText={item.name} />);
		const menuItemsMap = (arr, values) => arr.map(item => 
			<MenuItem 
				value={item.name} 
				key={item.id} 
        checked={values ? values.includes(item.name) : false}>
        {item.name}
      </MenuItem>
		);
		
		if (!user) return null;

		return (
      <div className="container" id="profileComponent">
        <Helmet>
          <title>{app.name} | Profilo</title>
          <link rel="canonical" href={app.url} />
        </Helmet>
        <div className="card light">
          {loading && <div aria-hidden="true" className="loader"><CircularProgress /></div>}
          <div className="container sm">
            <div className="row basic-profile">
              
              <div className="col-auto">
                <div className={`upload-avatar ${errors.upload ? 'error' : imgProgress === 100 ? 'success' : imgProgress > 0 ? 'loading' : ''}`}>
                  <Avatar className="avatar" src={imgPreview} alt={user.displayName}>{!imgPreview && getInitials(user.displayName)}</Avatar>
                  <div className="overlay">
                    <span title="Carica un'immagine">+</span>
                    <input type="file" accept="image/*" className="upload" onChange={this.onImageChange}/>
                  </div>
                  <div className="progress"></div>
                </div>
              </div>
              <div className="col">
                <div className="username">{user.displayName || 'Innominato'}</div>
                <div className="email">{user.email}</div>
              </div>
            </div>

            <div>&nbsp;</div>

            <form onSubmit={this.onSubmit} noValidate>
              <div className="form-group">
                <FormControl className="input-field" margin="normal" fullWidth>
                  <InputLabel error={Boolean(errors.displayName)} htmlFor="displayName">Nome e cognome</InputLabel>
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder="es: Mario Rossi"
                    value={user.displayName || ''}
                    disabled={Boolean(user.displayName)}
                    onChange={this.onChange}
                    error={Boolean(errors.displayName)}
                  />
                  {user.displayName && <FormHelperText className="message">Per modificare il <span className="hide-sm">nominativo</span><span className="show-sm">nome</span> scrivi a <a href={`mailto:${app.email}?subject=Biblo: modifica nominativo utente`}>{app.email}</a>.</FormHelperText>}
                  {errors.displayName && <FormHelperText className="message error">{errors.displayName}</FormHelperText>}
                </FormControl>
              </div>

              <div className="row">
                <div className="col-6 form-group">
                  <FormControl className="select-field" margin="normal" fullWidth>
                    <InputLabel error={Boolean(errors.sex)} htmlFor="sex">Sesso</InputLabel>
                    <Select
                      id="sex"
                      placeholder="es: Femmina"
                      value={user.sex || ''}
                      onChange={this.onChangeSelect("sex")}
                      error={Boolean(errors.sex)}>
                      <MenuItem key="m" value="m">Uomo</MenuItem>
                      <MenuItem key="f" value="f">Donna</MenuItem>
                      <MenuItem key="x" value="x">Altro</MenuItem>
                    </Select>
                    {errors.sex && <FormHelperText className="message error">{errors.sex}</FormHelperText>}
                  </FormControl>
                </div>

                <div className="col-6 form-group">
                  <MuiPickersUtilsProvider utils={MomentUtils} moment={moment} locale="it">
                    <DatePicker 
                      className="date-picker"
                      name="birth_date"
                      cancelLabel="Annulla"
                      leftArrowIcon={icon.chevronLeft()}
                      rightArrowIcon={icon.chevronRight()}
                      format="D MMMM YYYY"
                      minDate={new Date().setFullYear(new Date().getFullYear() - 120)}
                      minDateMessage="E chi sei.. Matusalemme?"
                      maxDate={new Date().setFullYear(new Date().getFullYear() - 14)}
                      maxDateMessage="Età minima 14 anni"
                      label="Data di nascita"
                      value={user.birth_date ? new Date(user.birth_date) : null}
                      onChange={this.onChangeDate("birth_date")}
                      margin="normal"
                      animateYearScrolling
                      fullWidth
                    />
                  </MuiPickersUtilsProvider>
                </div>
              </div>

              <div className="form-group">
                <FormControl className="select-field" margin="normal" fullWidth>
                  <InputLabel htmlFor="languages">{`Lingue conosciute ${user.languages && this.state.user.languages.length > 1 ? ` (${this.state.user.languages.length})` : ""}`}</InputLabel>
                  <Select
                    id="languages"
                    placeholder="es: Italiano, Spagnolo"
                    value={user.languages || []}
                    onChange={this.onChangeSelect("languages")}
                    multiple>
                    {menuItemsMap(languages, user.languages)}
                  </Select>
                </FormControl>
              </div>

              <div className="form-group">
                <FormControl className="select-field" margin="normal" fullWidth>
                  <InputLabel htmlFor="continent">Continente</InputLabel>
                  <Select
                    id="continent"
                    placeholder="es: Europa"
                    value={user.continent || ''}
                    onChange={this.onChangeSelect("continent")}>
                    {menuItemsMap(continents)}
                  </Select>
                </FormControl>
              </div>

              {(user.continent === 'Europa' || user.continent === 'Nordamerica') && 
                <div className="form-group">
                  <FormControl className="select-field" margin="normal" fullWidth>
                    <InputLabel htmlFor="nation">Nazione</InputLabel>
                    <Select
                      id="nation"
                      placeholder="es: Italia"
                      value={user.country || ''}
                      onChange={this.onChangeSelect("country")}>
                      {(user.continent === 'Europa') && menuItemsMap(europeanCountries)}
                      {(user.continent === 'Nordamerica') && menuItemsMap(northAmericanCountries)}
                    </Select>
                  </FormControl>
                </div>
              }

              <div className="form-group">
                {(user.country) && (user.country === "Italia‎") ?
                  <FormControl className="select-field" margin="normal" fullWidth>
                    <InputLabel htmlFor="city">Provincia</InputLabel>
                    <Select
                      id="city"
                      placeholder="es: Torino"
                      value={user.city || ''}
                      onChange={this.onChangeSelect("city")}>
                      {menuItemsMap(italianProvinces)}
                    </Select>
                  </FormControl>
                :
                  <FormControl className="input-field" margin="normal" fullWidth>
                    <InputLabel error={Boolean(errors.city)} htmlFor="city">Città</InputLabel>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="es: New York"
                      value={user.city || ''}
                      onChange={this.onChange}
                      error={Boolean(errors.city)}
                    />
                    {errors.city && <FormHelperText className="message error">{errors.city}</FormHelperText>}
                  </FormControl>
                }
              </div>

              <div>&nbsp;</div>

              <FormHelperText className="message">Per cancellare l'account scrivi a <a href={`mailto:${app.email}?subject=Biblo: cancellazione account utente`}>{app.email}</a>.</FormHelperText>

              <div>&nbsp;</div>

            </form>
          </div>
          <div className="footer no-gutter">
            <button type="button" className={`btn btn-footer primary ${success && !changes && 'success'}`} disabled={!changes && 'disabled'} onClick={this.onSubmit}>{success ? 'Modifiche salvate' : 'Salva le modifiche'}</button>
          </div>
        </div>
        <div className="text-center"> 
          <Link to={`/dashboard/${user.uid}`} className="btn flat rounded">Vai alla dashboard</Link>
        </div>
      </div>
		);
	}
}