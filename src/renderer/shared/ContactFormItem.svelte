<div class="grid grid-cols-3 gap-4 items-start py-4 px-5">
  <label for="contact" class="block text-sm mt-px pt-2">
    <slot name="label"></slot>
  </label>
  <div class="col-span-2">
    <div class="max-w-lg rounded-md shadow-sm">
      <slot></slot>
    </div>
  </div>
</div>