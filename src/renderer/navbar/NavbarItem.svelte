<script lang="ts">
  import Icon from "../shared/Icon.svelte";
  import {link} from 'svelte-spa-router';
  import active from 'svelte-spa-router/active';

  export let iconName: string;
  export let title: string = "";
  export let to: string = "/";
  export let activePath;

</script>

<a href={to} use:link use:active={activePath} class="text-white group flex items-center px-2 py-2 
 hover:bg-steel-600 hover:bg-opacity-75 cursor-pointer text-sm font-medium rounded-md"
      {title}>
  <Icon class="fill-current mr-2 h-6 w-6 text-steel-100" name={iconName} />
  <slot />
</a>

<style>
  a {
    text-decoration: none;
  }
</style>
