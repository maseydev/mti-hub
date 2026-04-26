<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
    <div class="text-center">
      <div class="text-8xl font-black text-slate-700">403</div>
      <h1 class="mt-4 text-2xl font-bold text-white">Доступ запрещён</h1>
      <p class="mt-2 text-slate-400">У вас нет прав для просмотра этой страницы.</p>
      <router-link to="/dashboard" class="mt-8 inline-flex rounded-md bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400">На главную</router-link>
    </div>
  </div>
</template>
