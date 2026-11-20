import SiteSkeleton from "../components/Skeleton";

/* Shown while the home page's content is being fetched from Redis */
export default function Loading() {
  return <SiteSkeleton />;
}
