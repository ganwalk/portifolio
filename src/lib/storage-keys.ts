// Chaves compartilhadas entre servidor e cliente.
//
// Elas vivem aqui, num módulo neutro, e não dentro dos contextos: constantes
// exportadas de um arquivo "use client" chegam vazias quando um Server Component
// as importa, e o script que roda antes da pintura precisa dos valores reais.

export const BORING_STORAGE_KEY = "boring-mode";
export const BORING_ATTRIBUTE = "data-boring";
export const SOUND_STORAGE_KEY = "ui-sound";
