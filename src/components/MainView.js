import MapView from './MapView.vue';

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
       // this.ugis.mapp.map.updateSize();
    }
};