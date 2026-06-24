import 'dotenv/config';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { slack } from '@corsair-dev/slack';
import { github } from '@corsair-dev/github';
import { conn } from './db';

export const corsair = createCorsair({
    // Gmail + Calendar are OAuth (Google); Slack + GitHub are API-key/token
    // plugins connected per-tenant from the Connections page.
    plugins: [gmail(), googlecalendar(), slack(), github()],
    database: conn,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});
