import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import QueryRegistration from '../views/QueryRegistration.vue';
import RegisterForm from '../views/RegisterForm.vue';
import TicketDetail from '../views/TicketDetail.vue';
import Checkin from '../views/Checkin.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/query',
    name: 'QueryRegistration',
    component: QueryRegistration
  },
  {
    path: '/register',
    name: 'RegisterForm',
    component: RegisterForm
  },
  {
    path: '/ticket/:tokenId',
    name: 'TicketDetail',
    component: TicketDetail
  },
  {
    path: '/checkin/:tokenId',
    name: 'Checkin',
    component: Checkin
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;