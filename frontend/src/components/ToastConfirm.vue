<template>
    <div>
      <p class="mb-2">Please respond YES to confirm you are safe</p>
      <button @click="handleConfirm" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
        YES
      </button>
    </div>
  </template>
  
  <script>
  export default {
    emits: ["confirm"],
    methods: {
      handleConfirm() {
        this.$emit("confirm");
      },
    },
  };
  </script>
  