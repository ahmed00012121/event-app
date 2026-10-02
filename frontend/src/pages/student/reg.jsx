import { useState } from "react";
import Nav from "../../components/nav";
import Footer from "../../components/footer";
import RegForm from "../../components/RegForm";
import ChatbotWidget from "../../components/chatbotWidget";

import "../../assets/student/Reg.css"; 
import "../../assets/shared/chatbot.css";

export default function Reg() {
  const [refresh, setRefresh] = useState(false);

  const handleRegistrationSuccess = () => {
    setRefresh((prev) => !prev);
  };

  return (
    <>
      <Nav />
      <div className="reg-page">
        <h2 className="text-center mb-4">📝 Event Registration</h2>
        <RegForm onRegistrationSuccess={handleRegistrationSuccess} />
      </div>
      <Footer />
      <ChatbotWidget />
    </>
  );
}
