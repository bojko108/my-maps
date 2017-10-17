import config from '../map-config.json';

export default {
    name: 'map-view',
    store: ['ugis'],
    mounted() {
        this.ugis = new UGisApp(config);
        this.ugis.createMap();
        this.ugis.createWidgets();

        this.ugis.mapp.map.updateSize();
    }
};