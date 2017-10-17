// === DEFAULT / CUSTOM STYLE ===
// WARNING! always comment out ONE of the two require() calls below.
// 1. use next line to activate CUSTOM STYLE (./src/themes)
// require(`./themes/app.${__THEME}.styl`)
// 2. or, use next line to activate DEFAULT QUASAR STYLE
require(`quasar/dist/quasar.${__THEME}.css`)
// ==============================

// Uncomment the following lines if you need IE11/Edge support
// require(`quasar/dist/quasar.ie`)
// require(`quasar/dist/quasar.ie.${__THEME}.css`)

import Vue from 'vue';
import VueStash from 'vue-stash';
import Quasar, {
  dom,
  event,
  openURL,
  QLayout,
  QToolbar,
  QToolbarTitle,
  QBtn,
  QIcon,
  QList,
  QListHeader,
  QItem,
  QItemSide,
  QItemMain
} from 'quasar';

Vue.config.productionTip = false;
Vue.use(Quasar, {
  components: {
    dom,
    event,
    openURL,
    QLayout,
    QToolbar,
    QToolbarTitle,
    QBtn,
    QIcon,
    QList,
    QListHeader,
    QItem,
    QItemSide,
    QItemMain
  }
}); // Install Quasar Framework

Vue.use(VueStash);

if (__THEME === 'mat') {
  require('quasar-extras/roboto-font');
}
import 'quasar-extras/material-icons';
// import 'quasar-extras/ionicons'
// import 'quasar-extras/fontawesome'
// import 'quasar-extras/animate'

// import * as g from './statics/ugis.js';
// window.UGisApp = g.UGisApp;


Quasar.start(() => {
  /* eslint-disable no-new */
  window.wtf = new Vue({
    el: '#q-app',
    render: h => h(require('./App.vue').default),
    data: {
      store: {
        ugis: {}
      }
    }
  });
});
