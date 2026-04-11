# Images Dashboard

A modern, reactive management dashboard for the [WildDev/images](https://github.com/WildDev/images) Java image-processing service.

---

### Screenshot

![Images Dashboard — light theme](screenshots/dashboard-light.jpg)

---

### Get started

Requirements:
* Node.js ≥ 20
* pnpm ≥ 9
* PostgreSQL ≥ 14

Clone the repository and install dependencies:

```bash
git clone https://github.com/WildDev/images-dashboard.git
cd images-dashboard
pnpm install
```

Configure environment variables:

```dotenv
# Required — PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/images_dashboard

# Optional — URL of a running WildDev/images Java service instance.
# When omitted the dashboard operates in local-only mode.
IMAGES_SERVICE_URL=http://localhost:8000

# Required — secret used for Express session signing
SESSION_SECRET=change_me_to_something_random
```

Push the database schema:

```bash
pnpm --filter @workspace/db run push
```

Start the API server:

```bash
pnpm --filter @workspace/api-server run dev
```

Start the dashboard in a separate terminal:

```bash
pnpm --filter @workspace/images-dashboard run dev
```

Open the printed local URL in your browser.

---

### Credits

Built with [Replit](https://replit.com).

---

### License

*This project is licensed under the Apache License 2.0.*

Dependencies:

- React (MIT)
- Vite (MIT)
- Express (MIT)
- Drizzle ORM (Apache 2.0)
- Tailwind CSS (MIT)
- shadcn/ui (MIT)
- Zod (MIT)

See [LICENSE](LICENSE) file for details.
