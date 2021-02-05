<script lang="ts">
  import Icon from "../shared/Icon.svelte";
  import {link} from 'svelte-spa-router';
  import {location} from 'svelte-spa-router';

  export let iconName: string;
  export let title: string = "";
  export let to: string = "/";

  const isActive = $location === to;
</script>

<a href={to} use:link class="text-white group flex items-center px-2 py-2 cursor-pointer text-sm font-medium rounded-md"
      class:bg-steel-800={isActive} 
      class:hover:bg-steel-600={!isActive}
      class:hover:bg-opacity-75={!isActive}
      {title}>
  <Icon class="fill-current mr-3 h-6 w-6 text-steel-100" name={iconName} />
  <slot />
</a>