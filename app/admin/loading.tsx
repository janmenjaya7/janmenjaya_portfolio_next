import { AdminPageSkeleton } from "./_components/AdminSkeleton";

/* Shown while the admin page checks the session and loads data from Redis */
export default function AdminLoading() {
  return <AdminPageSkeleton />;
}
