<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
    <div class="mb-8 flex items-center gap-4">
      <div class="grid size-12 place-items-center rounded-lg bg-sky-500 text-xl font-black text-slate-950">M</div>
      <div>
        <div class="text-3xl font-black tracking-tight text-white">MTI-HUB</div>
        <div class="mt-1 ui-eyebrow">Billing control center</div>
      </div>
    </div>

    <section class="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/40">
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-white">Вход в систему</h1>
        <p class="mt-3 text-sm leading-6 text-slate-400">Управление клиентами, оплатами и финансами студии</p>
      </div>
      <slot />
    </section>
  </div>
</template>
