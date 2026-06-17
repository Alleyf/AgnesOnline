import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import HomePage from "@/pages/HomePage/HomePage";
import ChatPage from "@/pages/ChatPage/ChatPage";
import ImageGenPage from "@/pages/ImageGenPage/ImageGenPage";
import VideoGenPage from "@/pages/VideoGenPage/VideoGenPage";
import AssetsPage from "@/pages/AssetsPage/AssetsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="image-gen" element={<ImageGenPage />} />
        <Route path="video-gen" element={<VideoGenPage />} />
        <Route path="assets" element={<AssetsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
