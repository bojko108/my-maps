<template>
  <!-- Don't drop "q-app" class -->
  <div id="q-app">
    <q-layout ref="layout" view="lHh Lpr fff" :left-class="{'bg-grey-2': true}" :left-breakpoint=3000>
      <q-toolbar slot="header" class="gloss">
        <q-btn flat @click="$refs.layout.toggleLeft()">
          <q-icon name="menu" />
        </q-btn>
  
        <q-toolbar-title>
          My Maps
          <!-- <div slot="subtitle">Running on Quasar v{{$q.version}}</div> -->
        </q-toolbar-title>
      </q-toolbar>
  
      <div slot="left">
        <!--
            Use <q-side-link> component
            instead of <q-item> for
            internal vue-router navigation
          -->
  
        <q-list no-border link inset-delimiter>
          <q-list-header>Essential Links</q-list-header>
          <q-item>
            <q-item-side icon="school" />
            <q-item-main label="Docs" sublabel="quasar-framework.org" />
          </q-item>
          <q-item>
            <q-item-side icon="record_voice_over" />
            <q-item-main label="Forum" sublabel="forum.quasar-framework.org" />
          </q-item>
          <q-item>
            <q-item-side icon="chat" />
            <q-item-main label="Gitter Channel" sublabel="Quasar Lobby" />
          </q-item>
          <q-item>
            <q-item-side icon="rss feed" />
            <q-item-main label="Twitter" sublabel="@quasarframework" />
          </q-item>
        </q-list>
      </div>
  
      <map-view></map-view>
  
    </q-layout>
  </div>
</template>

<script src="./App.js"></script>

<style lang="stylus">

</style>




