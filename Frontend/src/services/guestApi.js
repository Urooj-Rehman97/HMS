import { http, pagedOf, listOf } from './api';

export const guestApi = {
  list: async (q = {}) =>
    pagedOf(await http.get('/guests', q), 'data'),

  active: async () =>
    listOf(await http.get('/guests/active')),

  create: async (body) =>
    (await http.post('/guests', body)).data,

  update: async (id, body) =>
    (await http.put(`/guests/${id}`, body)).data,

  setActive: (id, active) =>
    http.patch(
      `/guests/${id}/${active ? 'activate' : 'deactivate'}`
    ),

  remove: (id) =>
    http.del(`/guests/${id}`),
};