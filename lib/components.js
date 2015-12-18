'use strict';

const asyncblock = require('asyncblock');
const nimrod = require('nimrod');
const vm = require('vm');
const vue = require('vue');

vue.config.debug = true;

let context = null;
let state = {
  id: 'INIT',
  connectedTo: null,
  context: null
};

const actions = {
  showConnectView: function() {
    state.id = 'CONNECT';
  },
  connectTo: function(name, uri) {
    asyncblock((flow) => {
      context = nimrod(uri, flow);
      state.connectedTo = {
        name: name,
        uri: uri
      };
      state.id = 'CONNECTED';
    });
  }
};

vue.component('navbar', {
  props: ['connectedTo'],
  template: `
    <div class="navbar">
      <h1>IronMongo</h1>
      <connection-indicator :connected-to="connectedTo">
      </connection-indicator>
    </div>
  `
});

vue.component('connection-indicator', {
  props: ['connectedTo'],
  template: `
    <div class="connection-indicator">
      <button v-if="!connectedTo" v-on:click="connect();">
        <i class="fa fa-database"></i>
        Connect
      </button>
      <div v-if="connectedTo">
        <i class="fa fa-leaf"></i>
        {{connectedTo.name}}
      </div>
    </div>
  `,
  methods: {
    connect: function() {
      actions.showConnectView();
    }
  }
});

vue.component('connect', {
  data: () => {
    return {
      name: '',
      uri: ''
    };
  },
  template: `
    <div class="connect">
      <input v-model="name" placeholder="Connection name, e.g. 'My Dev DB'">
      <input v-model="uri" placeholder="MongoDB URI">
      <button v-on:click="doConnect(name, uri);">Connect</button>
    </div>
  `,
  methods: {
    doConnect: function(name, uri) {
      actions.connectTo(name, uri);
    }
  }
});

vue.component('db', {
  data: () => {
    return {
      command: '',
      results: null
    }
  },
  template: `
    <div class="db">
      <collection-list></collection-list>
      <div class="results">
        <input type="text" v-model="command" placeholder="Shell Query">
        <button v-on:click="run(command);">
          Run
        </button>
        <div v-if="results">
          {{results | json}}
        </div>
      </div>
    </div>
  `,
  methods: {
    run: function(command) {
      asyncblock((flow) => {
        context.setFlow(flow);
        const _context = vm.createContext(context);
        const result = vm.runInContext(command, _context);
        this.results = result;
      });
    }
  }
});

vue.component('collection-list', {
  data: () => {
    let data = {
      collections: []
    };

    asyncblock((flow) => {
      context.setFlow(flow);
      data.collections = context.db.listCollections().map(coll => coll.name);
    });

    return data;
  },
  template: `
    <div class="collection-list">
      <h2>Collections</h2>
      <div v-for="collection in collections">
        {{collection}}
      </div>
    </div>
  `
});

vue.component('intro', {
  template: `
    <h1>Click "Connect" to connect to a DB</h1>
  `
});

new vue({
  el: '#vue-container',
  template: `
    <navbar :connected-to="state.connectedTo"></navbar>
    <intro v-if="state.id === 'INIT'"></intro>
    <connect v-if="state.id === 'CONNECT'"></connect>
    <db v-if="state.id === 'CONNECTED'"></db>
  `,
  data: {
    state: state
  }
});
