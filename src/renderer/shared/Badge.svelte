<script lang="ts">
  export let type: string = "default";
  export let isLarge: boolean = false;
</script>

<span class="inline-flex items-center py-0.5 rounded-full font-medium bg-gray-100 text-gray-800"
   class:text-xs={!isLarge}
   class:text-sm={isLarge}
   class:px-2.5={!isLarge}
   class:px-3={isLarge}
   class:bg-gray-100={type === "default"}
   class:text-gray-800={type === "default"}
   class:bg-red-100={type === "error"}
   class:text-red-800={type === "error"}
   class:bg-green-100={type === "success"}
   class:text-green-800={type === "success"}
   class:bg-blue-100={type === "info"}
   class:text-blue-800={type === "info"}
   class:bg-yellow-100={type === "warning"}
   class:text-yellow-800={type === "warning"}>
  <slot></slot>
</span>