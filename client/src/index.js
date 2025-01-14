import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createBrowserHistory } from 'history';
import { Router } from 'react-router-dom';
import { store } from './Store';
import { App } from './containers/app';
import * as serviceWorker from './serviceWorker';

render(
  <Provider store={store}>
    <Router history={createBrowserHistory()}>
      <App />
    </Router>
  </Provider>,
  document.getElementById('root'),

);
serviceWorker.register();
