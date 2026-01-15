"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface Service {
  id: string;
  title: string;
  requirements: string;
  price: number;
  duration: string;
}

export default function ChatbotPage() {
  // state for managing which faq is currently open
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  // state for faqs from database
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  // state for loading
  const [faqsLoading, setFaqsLoading] = useState(true);
  // state for services from database
  const [services, setServices] = useState<Service[]>([]);
  // state for services loading
  const [servicesLoading, setServicesLoading] = useState(true);

  // helper function to get icon based on service title
  const getServiceIcon = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("document") || titleLower.includes("clearance") || titleLower.includes("certificate")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2563eb" viewBox="0 0 256 256">
          <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"></path>
        </svg>
      );
    } else if (titleLower.includes("event") || titleLower.includes("registration")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2563eb" viewBox="0 0 256 256">
          <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-68-76a12,12,0,1,1-12-12A12,12,0,0,1,140,132Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,184,132ZM96,172a12,12,0,1,1-12-12A12,12,0,0,1,96,172Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,140,172Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,184,172Z"></path>
        </svg>
      );
    } else if (titleLower.includes("payment") || titleLower.includes("fee") || titleLower.includes("tax")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2563eb" viewBox="0 0 256 256">
          <path d="M184,89.57V84c0-25.08-37.83-44-88-44S8,58.92,8,84v40c0,20.89,26.25,37.49,64,42.46V172c0,25.08,37.83,44,88,44s88-18.92,88-44V132C248,111.3,222.58,94.68,184,89.57ZM232,132c0,13.22-30.79,28-72,28-3.73,0-7.43-.13-11.08-.37C170.49,151.77,184,139,184,124V105.74C213.87,110.19,232,122.27,232,132ZM72,150.25V126.46A183.74,183.74,0,0,0,96,128a183.74,183.74,0,0,0,24-1.54v23.79A163,163,0,0,1,96,152,163,163,0,0,1,72,150.25Zm96-40.32V124c0,8.39-12.41,17.4-32,22.87V123.5C148.91,120.37,159.84,115.71,168,109.93ZM96,56c41.21,0,72,14.78,72,28s-30.79,28-72,28S24,97.22,24,84,54.79,56,96,56ZM24,124V109.93c8.16,5.78,19.09,10.44,32,13.57v23.37C36.41,141.4,24,132.39,24,124Zm64,48v-4.17c2.63.1,5.29.17,8,.17,3.88,0,7.67-.13,11.39-.35A121.92,121.92,0,0,0,120,171.41v23.46C100.41,189.4,88,180.39,88,172Zm48,26.25V174.4a179.48,179.48,0,0,0,24,1.6,183.74,183.74,0,0,0,24-1.54v23.79a165.45,165.45,0,0,1-48,0Zm64-3.38V171.5c12.91-3.13,23.84-7.79,32-13.57V172C232,180.39,219.59,189.4,200,194.87Z"></path>
        </svg>
      );
    } else if (titleLower.includes("health") || titleLower.includes("medical")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2563eb" viewBox="0 0 256 256">
          <path d="M72,144H32a8,8,0,0,1,0-16H67.72l13.62-20.44a8,8,0,0,1,13.32,0l25.34,38,9.34-14A8,8,0,0,1,136,128h24a8,8,0,0,1,0,16H140.28l-13.62,20.44a8,8,0,0,1-13.32,0L88,126.42l-9.34,14A8,8,0,0,1,72,144ZM178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,.75,0,1.5,0,2.25a8,8,0,1,0,16-.5c0-.58,0-1.17,0-1.75A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46c0,53.61-77.76,102.15-96,112.8-10.83-6.31-42.63-26-66.68-52.21a8,8,0,1,0-11.8,10.82c31.17,34,72.93,56.68,74.69,57.63a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40Z"></path>
        </svg>
      );
    } else if (titleLower.includes("education") || titleLower.includes("scholarship") || titleLower.includes("learning")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2563eb" viewBox="0 0 256 256">
          <path d="M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87v48.42a15.91,15.91,0,0,0,4.06,10.65C49.16,191.53,78.51,216,128,216a130,130,0,0,0,48-8.76V240a8,8,0,0,0,16,0V199.51a115.63,115.63,0,0,0,27.94-22.57A15.91,15.91,0,0,0,224,166.29V117.87l27.76-14.81a8,8,0,0,0,0-14.12ZM128,200c-43.27,0-68.72-21.14-80-33.71V126.4l76.24,40.66a8,8,0,0,0,7.52,0L176,143.47v46.34C163.4,195.69,147.52,200,128,200Zm80-33.75a97.83,97.83,0,0,1-16,14.25V134.93l16-8.53ZM188,118.94l-.22-.13-56-29.87a8,8,0,0,0-7.52,14.12L171,128l-43,22.93L25,96,128,41.07,231,96Z"></path>
        </svg>
      );
    } else if (titleLower.includes("ai") || titleLower.includes("assistant") || titleLower.includes("chatbot")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2563eb" viewBox="0 0 256 256">
          <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-24,16v24H116V152ZM80,164a12,12,0,0,1,12-12h8v24H92A12,12,0,0,1,80,164Zm84,12h-8V152h8a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z"></path>
        </svg>
      );
    }
    // default icon
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#2563eb" viewBox="0 0 256 256">
        <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"></path>
      </svg>
    );
  };

  // fetch services from supabase
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching services:", error);
        } else if (data) {
          setServices(data);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, []);

  // fetch faqs from supabase
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setFaqsLoading(true);
        const { data, error } = await supabase
          .from("faqs")
          .select("id, question, answer")
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching FAQs:", error);
        } else if (data) {
          setFaqs(data);
        }
      } catch (err) {
        console.error("Error fetching FAQs:", err);
      } finally {
        setFaqsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  // barangay officials data for 2024 administration
  const officials = [
    { name: "Hon. Rolando A. Alba Jr.", position: "Punong Barangay" },
    { name: "Hon. Jose B. Galang Jr.", position: "Barangay Kagawad" },
    { name: "Hon. Gerardo Q. Andrade", position: "Barangay Kagawad" },
    { name: "Hon. Roderick T. Gaton", position: "Barangay Kagawad" },
    { name: "Hon. Glenda C. Flores", position: "Barangay Kagawad" },
    { name: "Hon. Ferdinand R. Dicen", position: "Barangay Kagawad" },
    { name: "Hon. Joey A. Maglalang", position: "Barangay Kagawad" },
    { name: "Hon. Jerome L. Duos", position: "Barangay Kagawad" },
    { name: "Hon. Zenaida L. Miranda", position: "IPMR" },
    { name: "Hon. Angel Victoria M. Bibanco", position: "SK Chairperson" },
    { name: "Mr. Edmer T. Lucido", position: "Barangay Secretary" },
    { name: "Ms. Rosalinda P. Eledia", position: "Barangay Treasurer" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 bg-white">
      {/* hero section with background image */}
      <section className="relative rounded-3xl py-6 overflow-hidden">
        {/* background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/old-cab-court.jpg)' }}
        ></div>
        {/* dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* header navigation inside hero section */}
        <header className="relative px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/baranguide-log.png" alt="BaranGuide Logo" width={150} height={50} className="h-10 w-auto" />
        </div>
            <nav className="hidden md:flex items-center gap-4 lg:gap-4">
              <a href="#services" className="px-3 py-2 text-white text-sm tracking-tight font-medium hover:text-gray-200 transition-colors whitespace-nowrap" >
                Our Services
              </a>
              <a href="#faqs" className="px-3 py-2 text-white text-sm tracking-tight font-medium hover:text-gray-200 transition-colors whitespace-nowrap" >
                FAQS
              </a>
              <a href="#contacts" className="px-3 py-2 text-white text-sm tracking-tight font-medium hover:text-gray-200 transition-colors whitespace-nowrap" >
                Contacts
              </a>
              <a href="#officials" className="px-3 py-2 text-white text-sm tracking-tight font-medium hover:text-gray-200 transition-colors whitespace-nowrap" >
                Barangay Officials
              </a>
            </nav>
          </div>
        </header>

        {/* hero content area */}
        <div className="relative mt-16 md:mt-32">
          <div className="max-w-4xl mx-auto text-center px-4">
            {/* main hero heading */}
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
              Stay One Step Ahead with AI-Driven Barangay Assistance
            </h2>
            {/* hero description text */}
            <p className="text-sm md:text-md text-white/90 mb-8 md:mb-12 leading-relaxed tracking-tight drop-shadow-md">
              Baranguide simplifies barangay services, requirements, and local
              information through an intelligent, always-available AI chatbot.{" "}
            </p>

            {/* ai chatbot call-to-action button */}
            <div className="flex justify-center mb-16 md:mb-32">
              <Link href="/chatbot" className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-white text-gray-900 rounded-full text-sm" >
                <span className="tracking-tight">Chat with AI Assistant</span>
                <svg className="w-4 md:w-5 h-4 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* info cards grid: office hours, location, and help */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {/* office hours card */}
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256" >
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"></path>
                    </svg>{" "}
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-sm tracking-tight text-gray-900">
                      Office Hours
                    </h4>
                    <p className="text-xs text-gray-600 tracking-tight">
                      Mon-Fri, 8:00 AM - 5:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* location card */}
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256" >
                      <path d="M237.33,106.21,61.41,41l-.16-.05A16,16,0,0,0,40.9,61.25a1,1,0,0,0,.05.16l65.26,175.92A15.77,15.77,0,0,0,121.28,248h.3a15.77,15.77,0,0,0,15-11.29l.06-.2,21.84-78,78-21.84.2-.06a16,16,0,0,0,.62-30.38ZM149.84,144.3a8,8,0,0,0-5.54,5.54L121.3,232l-.06-.17L56,56l175.82,65.22.16.06Z"></path>
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-sm text-gray-900 tracking-tight">
                      Location
                    </h4>
                    <p className="text-xs text-gray-600 tracking-tight">
                      Barangay Hall, Old Cabalan
                    </p>
                  </div>
                </div>
              </div>
              {/* need help card */}
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256" >
                      <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-24,16v24H116V152ZM80,164a12,12,0,0,1,12-12h8v24H92A12,12,0,0,1,80,164Zm84,12h-8V152h8a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z"></path>
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-sm tracking-tight text-gray-900">
                      Need Help?
                    </h4>
                    <p className="text-xs text-gray-600 tracking-tight">
                      Chat with our AI assistant!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* our services section */}
      <section id="services" className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* section heading */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl tracking-tight font-bold text-gray-900 mb-3">
              Our Barangay Services
            </h2>
          </div>
          {/* services grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {servicesLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : services.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p>No services available at the moment.</p>
              </div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-white mb-6">
                    {getServiceIcon(service.title)}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-1">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-xs tracking-tight leading-relaxed mb-2">
                    {service.requirements}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="font-semibold text-blue-600">₱{service.price.toFixed(2)}</span>
                    <span>•</span>
                    <span>{service.duration}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* barangay demographics section */}
      <section id="demographics" className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* section heading */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl tracking-tight font-bold text-gray-900 mb-3">
              Barangay Demographics
            </h2>
            <p className="text-sm md:text-base tracking-tight text-gray-600 max-w-2xl mx-auto">
              Key statistics about our community in Old Cabalan, Olongapo City
            </p>
          </div>
          {/* demographics grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Population */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M27.2,126.4a8,8,0,0,0,11.2-1.6,52,52,0,0,1,83.2,0,8,8,0,0,0,11.2,1.59,7.73,7.73,0,0,0,1.59-1.59h0a52,52,0,0,1,83.2,0,8,8,0,0,0,12.8-9.61A67.85,67.85,0,0,0,203,93.51a40,40,0,1,0-53.94,0,67.27,67.27,0,0,0-21,14.31,67.27,67.27,0,0,0-21-14.31,40,40,0,1,0-53.94,0A67.88,67.88,0,0,0,25.6,115.2,8,8,0,0,0,27.2,126.4ZM176,40a24,24,0,1,1-24,24A24,24,0,0,1,176,40ZM80,40A24,24,0,1,1,56,64,24,24,0,0,1,80,40ZM203,197.51a40,40,0,1,0-53.94,0,67.27,67.27,0,0,0-21,14.31,67.27,67.27,0,0,0-21-14.31,40,40,0,1,0-53.94,0A67.88,67.88,0,0,0,25.6,219.2a8,8,0,1,0,12.8,9.6,52,52,0,0,1,83.2,0,8,8,0,0,0,11.2,1.59,7.73,7.73,0,0,0,1.59-1.59h0a52,52,0,0,1,83.2,0,8,8,0,0,0,12.8-9.61A67.85,67.85,0,0,0,203,197.51ZM80,144a24,24,0,1,1-24,24A24,24,0,0,1,80,144Zm96,0a24,24,0,1,1-24,24A24,24,0,0,1,176,144Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Total Population</p>
                  <h3 className="text-2xl md:text-3xl tracking-tight font-bold text-gray-900 mb-1">24,571</h3>
                </div>
              </div>
            </div>

            {/* Land Area */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M228.92,49.69a8,8,0,0,0-6.86-1.45L160.93,63.52,99.58,32.84a8,8,0,0,0-5.52-.6l-64,16A8,8,0,0,0,24,56V200a8,8,0,0,0,9.94,7.76l61.13-15.28,61.35,30.68A8.15,8.15,0,0,0,160,224a8,8,0,0,0,1.94-.24l64-16A8,8,0,0,0,232,200V56A8,8,0,0,0,228.92,49.69ZM104,52.94l48,24V203.06l-48-24ZM40,62.25l48-12v127.5l-48,12Zm176,131.5-48,12V78.25l48-12Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Land Area (hectares)</p>
                  <h3 className="text-2xl md:text-3xl tracking-tight font-bold text-gray-900 mb-1">1,200</h3>
                </div>
              </div>
            </div>

            {/* Households */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M240,208H224V136l2.34,2.34A8,8,0,0,0,237.66,127L139.31,28.68a16,16,0,0,0-22.62,0L18.34,127a8,8,0,0,0,11.32,11.31L32,136v72H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM48,120l80-80,80,80v88H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48Zm96,88H112V160h32Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Households</p>
                  <h3 className="text-2xl md:text-3xl tracking-tight font-bold text-gray-900 mb-1">7,680</h3>
                </div>
              </div>
            </div>

            {/* Registered Voters */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm40-80V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56ZM216,200V56H40V200H216Zm-80.26-34a8,8,0,1,1-15.5,4c-2.63-10.26-13.06-18-24.25-18s-21.61,7.74-24.25,18a8,8,0,1,1-15.5-4,39.84,39.84,0,0,1,17.19-23.34,32,32,0,1,1,45.12,0A39.76,39.76,0,0,1,135.75,166ZM96,136a16,16,0,1,0-16-16A16,16,0,0,0,96,136Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Registered Voters</p>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-1">9,370</h3>                </div>
              </div>
            </div>

            {/* Precincts */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M240,208H224V96a16,16,0,0,0-16-16H144V32a16,16,0,0,0-24.88-13.32L39.12,72A16,16,0,0,0,32,85.34V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM208,96V208H144V96ZM48,85.34,128,32V208H48ZM112,112v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm-32,0v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm0,56v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Zm32,0v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Precincts</p>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-1">102</h3>
                </div>
              </div>
            </div>

            {/* Families */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Families</p>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-1">5,852</h3>
                </div>
              </div>
            </div>

            {/* Male */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M216,32H168a8,8,0,0,0,0,16h28.69L154.62,90.07a80,80,0,1,0,11.31,11.31L208,59.32V88a8,8,0,0,0,16,0V40A8,8,0,0,0,216,32ZM149.24,197.29a64,64,0,1,1,0-90.53A64.1,64.1,0,0,1,149.24,197.29Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Male</p>
                  <h3 className="text-2xl md:text-3xl tracking-tight font-bold text-gray-900 mb-1">10,566</h3>
                </div>
              </div>
            </div>

            {/* Female */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M208,96a80,80,0,1,0-88,79.6V200H88a8,8,0,0,0,0,16h32v24a8,8,0,0,0,16,0V216h32a8,8,0,0,0,0-16H136V175.6A80.11,80.11,0,0,0,208,96ZM64,96a64,64,0,1,1,64,64A64.07,64.07,0,0,1,64,96Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Female</p>
                  <h3 className="text-2xl md:text-3xl tracking-tight font-bold text-gray-900 mb-1">14,005</h3>
                </div>
              </div>
            </div>

            {/* Married */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,155.61,146.24,204.15,128,214.8Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Married</p>
                  <h3 className="text-2xl md:text-3xl tracking-tight font-bold text-gray-900 mb-1">16,823</h3>
                </div>
              </div>
            </div>

            {/* Unmarried */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M178,40a61.6,61.6,0,0,0-43.84,18.16L128,64.32l-6.16-6.16A62,62,0,0,0,16,102c0,70,103.79,126.67,108.21,129a8,8,0,0,0,7.58,0C136.21,228.67,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102a46,46,0,0,1,78.53-32.53l6.16,6.16L106.34,86a8,8,0,0,0,0,11.31l24.53,24.53-16.53,16.52a8,8,0,0,0,11.32,11.32l22.18-22.19a8,8,0,0,0,0-11.31L123.31,91.63l22.16-22.16A46,46,0,0,1,224,102C224,155.61,146.24,204.15,128,214.8Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Unmarried</p>
                  <h3 className="text-2xl md:text-3xl tracking-tight font-bold text-gray-900 mb-1">5,471</h3>
                </div>
              </div>
            </div>

            {/* Filipino */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M42.76,50A8,8,0,0,0,40,56V224a8,8,0,0,0,16,0V179.77c26.79-21.16,49.87-9.75,76.45,3.41,16.4,8.11,34.06,16.85,53,16.85,13.93,0,28.54-4.75,43.82-18a8,8,0,0,0,2.76-6V56A8,8,0,0,0,218.76,50c-28,24.23-51.72,12.49-79.21-1.12C111.07,34.76,78.78,18.79,42.76,50ZM216,172.25c-26.79,21.16-49.87,9.74-76.45-3.41-25-12.35-52.81-26.13-83.55-8.4V59.79c26.79-21.16,49.87-9.75,76.45,3.4,25,12.35,52.82,26.13,83.55,8.4Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Filipino</p>
                  <h3 className="text-2xl md:text-3xl tracking-tight font-bold text-gray-900 mb-1">24,570</h3>
                </div>
              </div>
            </div>

            {/* Foreigner */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M128,24h0A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm88,104a87.61,87.61,0,0,1-3.33,24H174.16a157.44,157.44,0,0,0,0-48h38.51A87.61,87.61,0,0,1,216,128ZM102,168H154a115.11,115.11,0,0,1-26,45A115.27,115.27,0,0,1,102,168Zm-3.9-16a140.84,140.84,0,0,1,0-48h59.88a140.84,140.84,0,0,1,0,48ZM40,128a87.61,87.61,0,0,1,3.33-24H81.84a157.44,157.44,0,0,0,0,48H43.33A87.61,87.61,0,0,1,40,128ZM154,88H102a115.11,115.11,0,0,1,26-45A115.27,115.27,0,0,1,154,88Zm52.33,0H170.71a135.28,135.28,0,0,0-22.3-45.6A88.29,88.29,0,0,1,206.37,88ZM107.59,42.4A135.28,135.28,0,0,0,85.29,88H49.63A88.29,88.29,0,0,1,107.59,42.4ZM49.63,168H85.29a135.28,135.28,0,0,0,22.3,45.6A88.29,88.29,0,0,1,49.63,168Zm98.78,45.6a135.28,135.28,0,0,0,22.3-45.6h35.66A88.29,88.29,0,0,1,148.41,213.6Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Foreigner</p>
                  <h3 className="text-2xl md:text-3xl tracking-tight font-bold text-gray-900 mb-1">1</h3>
                </div>
              </div>
            </div>

            {/* Indigenous People */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256">
                    <path d="M230.33,141.06a24.34,24.34,0,0,0-18.61-4.77C230.5,117.33,240,98.48,240,80c0-26.47-21.29-48-47.46-48A47.58,47.58,0,0,0,156,48.75,47.58,47.58,0,0,0,119.46,32C93.29,32,72,53.53,72,80c0,11,3.24,21.69,10.06,33a31.87,31.87,0,0,0-14.75,8.4L44.69,144H16A16,16,0,0,0,0,160v40a16,16,0,0,0,16,16H120a7.93,7.93,0,0,0,1.94-.24l64-16a6.94,6.94,0,0,0,1.19-.4L226,182.82l.44-.2a24.6,24.6,0,0,0,3.93-41.56ZM119.46,48A31.15,31.15,0,0,1,148.6,67a8,8,0,0,0,14.8,0,31.15,31.15,0,0,1,29.14-19C209.59,48,224,62.65,224,80c0,19.51-15.79,41.58-45.66,63.9l-11.09,2.55A28,28,0,0,0,140,112H100.68C92.05,100.36,88,90.12,88,80,88,62.65,102.41,48,119.46,48ZM16,160H40v40H16Zm203.43,8.21-38,16.18L119,200H56V155.31l22.63-22.62A15.86,15.86,0,0,1,89.94,128H140a12,12,0,0,1,0,24H112a8,8,0,0,0,0,16h32a8.32,8.32,0,0,0,1.79-.2l67-15.41.31-.08a8.6,8.6,0,0,1,6.3,15.9Z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 tracking-tight">Indigenous People (IPs)</p>
                  <h3 className="text-2xl md:text-3xl tracking-tight font-bold text-gray-900 mb-1">693</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* emergency contacts section */}
      <section id="emergency" className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* section heading */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl tracking-tight font-bold text-red-900 mb-3">
              FOR PUBLIC ASSISTANCE & EMERGENCIES PLS. CALL US!
            </h2>
            <p className="text-sm md:text-base tracking-tight text-red-700 max-w-2xl mx-auto">
              Emergency hotlines and contact information for immediate assistance
            </p>
          </div>

          {/* emergency contacts list */}
          <div className="max-w-4xl mx-auto space-y-4 mb-8 md:mb-12">
            {/* Admin Info Desk Officer */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight mb-1">ADMIN INFO DESK OFFICER</h3>
                  <p className="text-sm font-semibold text-red-700 mb-2 tracking-tight">FE YUMUL</p>
                  <p className="text-xs text-gray-600 uppercase tracking-tight">MONDAY TO FRIDAY - 8AM-5PM</p>
                </div>
                <div className="text-right md:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-red-700 tracking-tight">0910-637-9268</p>
                </div>
              </div>
            </div>

            {/* Health Center */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 tracking-tight">HEALTH CENTER - ATTENDING NURSE</h3>
                  <p className="text-sm font-semibold text-green-700 mb-2 tracking-tight">JONNAS KENNETH V. QUIAMBAO</p>
                  <p className="text-xs text-gray-600 uppercase tracking-tight">MONDAY TO FRIDAY - 8AM-5PM</p>
                </div>
                <div className="text-right md:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-green-700 tracking-tight">0939-809-2243</p>
                </div>
              </div>
            </div>

            {/* Lupon */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 tracking-tight">LUPON - PRESIDENT</h3>
                  <p className="text-sm font-semibold text-blue-700 mb-2 tracking-tight">CESAR IPAC</p>
                  <p className="text-xs text-gray-600 uppercase tracking-tight">MONDAY TO FRIDAY - 8AM-5PM</p>
                </div>
                <div className="text-right md:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-blue-700 tracking-tight">0966-680-7189</p>
                </div>
              </div>
            </div>

            {/* VAWC */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 tracking-tight">VAWC</h3>
                  <p className="text-sm font-semibold text-purple-700 mb-2 tracking-tight">DESK OFFICER - EMELINDA E. PURA</p>
                  <p className="text-xs text-gray-600 uppercase tracking-tight">24/7 AVAILABLE</p>
                </div>
                <div className="text-right md:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-purple-700 tracking-tight">0933-853-5043</p>
                </div>
              </div>
            </div>

            {/* QERU */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 tracking-tight">QERU - QUICK EMERGENCY RESPONSE UNIT</h3>
                  <p className="text-sm font-semibold text-orange-700 mb-2 tracking-tight">24/7 HOTLINE</p>
                  <p className="text-xs text-gray-600 uppercase tracking-tight">AVAILABLE 24/7</p>
                </div>
                <div className="text-right md:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-orange-700 tracking-tight">0961-661-6341</p>
                </div>
              </div>
            </div>

            {/* BPAT */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 tracking-tight">BPAT - BARANGAY PATROL ACTION TEAM</h3>
                  <p className="text-sm font-semibold text-indigo-700 mb-2 tracking-tight">HOTLINE</p>
                  <p className="text-xs text-gray-600 uppercase tracking-tight">AVAILABLE 24/7</p>
                </div>
                <div className="text-right md:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-indigo-700 tracking-tight">0948-474-0962</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filipino message */}
          <div className="text-center bg-red-50 rounded-2xl border border-red-200 p-6 md:p-8">
            <p className="text-base md:text-lg text-red-800 font-medium leading-relaxed tracking-tight">
              Para po sa HEATH ISSUES, PUBLIC CONCERNS at sa AGARARANG PAG-RESPONDE kontakin lamang po ang mga nakasulat na numero. Mula sa pamunuan at sangay ng Barangay Old Cabalan "MARAMING SALAMAT PO SA INYO"
            </p>
          </div>
        </div>
      </section>

      {/* help center - faqs section */}
      <section id="faqs" className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* section heading */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl tracking-tight font-bold text-gray-900 mb-3">
              Frequently Asked Questions
            </h2>
                </div>
          {/* faq accordion list */}
          <div className="space-y-4">
            {faqsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No FAQs available at the moment.</p>
              </div>
            ) : (
              faqs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden" >
                  <button onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} className="w-full px-4 md:px-6 py-4 md:py-5 text-left flex items-center justify-between" >
                    <span className="font-semibold tracking-tight text-sm text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    <svg className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${ openFaq === faq.id ? "rotate-180" : "" }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === faq.id && (
                    <div className="px-4 md:px-6 pb-5 text-sm md:text-xs tracking-tight text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {/* still have questions cta banner */}
          <div className="mt-8 md:mt-12 bg-gray-900 rounded-3xl px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-white mb-1">
                Still have a questions?
              </h3>
              <p className="text-gray-300 text-sm md:text-xs tracking-tight">
                Got more questions? We're here to help!
              </p>
            </div>
            <a href="/chatbot" className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-white text-gray-900 rounded-full font-semibold whitespace-nowrap" >
              <span className="tracking-tight text-sm">
                Chat with AI Assistant
              </span>
              <svg className="w-4 md:w-5 h-4 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* get in touch / contact section */}
      <section id="contacts" className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* section heading */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl tracking-tight font-bold text-gray-900 mb-3">
              Contact Us
            </h2>
          </div>
          {/* contact info grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256"><path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46ZM176,208A128.14,128.14,0,0,1,48,80,40.2,40.2,0,0,1,82.87,40a.61.61,0,0,0,0,.12l21,47L83.2,111.86a6.13,6.13,0,0,0-.57.77,16,16,0,0,0-1,15.7c9.06,18.53,27.73,37.06,46.46,46.11a16,16,0,0,0,15.75-1.14,8.44,8.44,0,0,0,.74-.56L168.89,152l47,21.05h0s.08,0,.11,0A40.21,40.21,0,0,1,176,208Z"></path></svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-900 tracking-tight mb-1">Phone Number</h3>
                  <p className="text-gray-600 text-sm md:text-xs tracking-tight">(047) 222-1234</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256"><path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z"></path></svg>                
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-900 tracking-tight mb-1">Email Address</h3>
                  <p className="text-gray-600 text-sm md:text-xs tracking-tight">info@oldcabalan.gov.ph</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#2563eb" viewBox="0 0 256 256"><path d="M237.33,106.21,61.41,41l-.16-.05A16,16,0,0,0,40.9,61.25a1,1,0,0,0,.05.16l65.26,175.92A15.77,15.77,0,0,0,121.28,248h.3a15.77,15.77,0,0,0,15-11.29l.06-.2,21.84-78,78-21.84.2-.06a16,16,0,0,0,.62-30.38ZM149.84,144.3a8,8,0,0,0-5.54,5.54L121.3,232l-.06-.17L56,56l175.82,65.22.16.06Z"></path></svg>                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-900 tracking-tight mb-1">Address</h3>
                  <p className="text-gray-600 text-sm md:text-xs tracking-tight">Old Cabalan, Olongapo City</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* barangay officials section */}
      <section id="officials" className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* section heading */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl tracking-tight font-bold text-gray-900 mb-3">
              Old Cabalan Barangay Officials
            </h2>
          </div>
          {/* officials card container */}
          <div className="bg-white rounded-2xl p-6 md:p-8">
            {/* officials list grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {officials.map((official, index) => (
                <div key={index} className="flex items-center gap-3 border border-gray-200 px-6 py-4 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  </div>
                  <div>
                    <p className="font-semibold tracking-tight text-sm text-gray-900">
                      {official.name}
                    </p>
                    <p className="text-sm md:text-xs tracking-tight text-gray-600">
                      {official.position}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>
      </section>

      {/* footer section */}
      <footer className="relative text-gray-900 py-8 md:py-12 rounded-3xl overflow-hidden">
        {/* natural scattered gradient overlay with blurred circles */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-64 md:w-96 h-64 md:h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        {/* base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          {/* footer content grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
            <div>
              <h4 className="text-gray-900 font-semibold tracking-tight mb-4">Quick Links</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link href="/chatbot" className="text-gray-700 text-sm md:text-xs font-medium tracking-tight hover:text-gray-900 transition-colors" >
                    AI Chatbot
                  </Link>
                </li>
                <li>
                  <a href="#services" className="text-gray-700 text-sm md:text-xs font-medium tracking-tight hover:text-gray-900 transition-colors" >
                    Services
                  </a>
                </li>
                <li>
                  <a href="#faqs" className="text-gray-700 text-sm md:text-xs font-medium tracking-tight hover:text-gray-900 transition-colors">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-700 text-sm md:text-xs font-medium tracking-tight hover:text-gray-900 transition-colors" >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold tracking-tight mb-4">Contact Info</h4>
              <ul className="space-y-2 text-sm md:text-xs tracking-tight font-medium text-gray-700">
                <li>(047) 222-1234</li>
                <li>info@oldcabalan.gov.ph</li>
                <li>Old Cabalan, Olongapo City</li>
              </ul>
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <h4 className="text-gray-900 font-bold tracking-tighter mb-1">Welcome to Barangay Old Cabalan with BaranGuide</h4>
                <p className="text-sm md:text-xs tracking-tight leading-relaxed text-gray-700">
                  Baranguide simplifies barangay services, requirements, and local information through an intelligent, always-available AI chatbot.
                </p>
              </div>
              {/* copyright notice */}
              <div className="text-start text-sm md:text-xs tracking-tight text-gray-700">
                <p>
                  &copy; {new Date().getFullYear()} BaranGuide - Barangay Old
                  Cabalan. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 
