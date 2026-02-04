import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";
import LandingPage from "../components/pages/LandingPage";
import AboutPage from "../components/pages/AboutPage";
import HowItWorksPage from "../components/pages/HowItWorksPage";
import ScanWorkflow from "../components/ScanWorkflow";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "how-it-works",
        element: <HowItWorksPage />,
      },
      {
        path: "scan",
        element: <ScanWorkflow />,
      },
    ],
  },
]);

export default router;
