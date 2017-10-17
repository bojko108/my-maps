import MapView from './components/MapView.vue';
import { Alert } from 'quasar';

export default {
    name: 'index',
    components: {
        'map-view': MapView
    },
    store: ['ugis'],
    data() {
        return {

        };
    },
    methods: {

    },
    mounted() {
        setTimeout(() => { this.ugis.mapp.map.updateSize(); }, 1);

        document.addEventListener("deviceready", onDeviceReady, false);
        function onDeviceReady() {
            Alert.create({ html: cordova.file });
        }
    }
};