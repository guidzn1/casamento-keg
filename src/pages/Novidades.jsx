import SectionTitle from "../components/SectionTitle";
import PostCard from "../components/PostCard";
import { news } from "../data/news";

export default function Novidades() {
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 860, padding: "0 10px" }}>

        <SectionTitle>NOVIDADES</SectionTitle>

        {news.map((item) => (
          <PostCard
            key={item.id}
            title={item.title}
            date={item.date}
            category={item.category}
            content={item.content}
          />
        ))}

      </div>
    </div>
  );
}
