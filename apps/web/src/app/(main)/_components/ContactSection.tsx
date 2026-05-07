'use client';

import { Button } from '@movie-hub/shacdn-ui/button';
import { Facebook, MessageCircle } from 'lucide-react';
import { Input } from '@movie-hub/shacdn-ui/input';
import { Textarea } from '@movie-hub/shacdn-ui/textarea';

export const ContactSection = () => {
  return (
    <section className="w-full bg-[#0f172a] border-t border-white/5 py-16 mb-0 relative z-10">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-24 xl:px-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Left Side: Contact Info & Socials */}
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider">
              Liên Hệ Với Chúng Tôi
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary to-purple-400" />

            <p className="text-gray-400 text-lg">
              Kết nối với chúng tôi qua các kênh mạng xã hội hoặc gửi tin nhắn
              trực tiếp để được hỗ trợ nhanh nhất.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="h-14 px-8 text-lg font-bold uppercase tracking-wide bg-[#3b5998] hover:bg-[#2d4373] text-white rounded-lg shadow-lg flex items-center gap-3 transition-transform hover:-translate-y-1">
                <Facebook className="fill-current w-6 h-6" />
                Facebook
              </Button>
              <Button className="h-14 px-8 text-lg font-bold uppercase tracking-wide bg-[#0068ff] hover:bg-[#0054cc] text-white rounded-lg shadow-lg flex items-center gap-3 transition-transform hover:-translate-y-1">
                <MessageCircle className="fill-current w-6 h-6 border-2 border-white rounded-full p-0.5" />
                Zalo Chat
              </Button>
            </div>
          </div>

          {/* Right Side: Contact Form */}
          <div className="bg-[#1e293b] p-8 md:p-10 rounded-2xl border-l-4 border-primary shadow-2xl relative overflow-hidden group">
            {/* Decorative Background Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-primary/10 transition-colors" />

            <h3 className="text-2xl font-bold text-white uppercase tracking-wide mb-6 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-primary block" />
              Thông Tin Liên Hệ
            </h3>

            <form className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Họ Tên"
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary h-12"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary h-12"
                />
              </div>
              <Input
                placeholder="Số Điện Thoại"
                type="tel"
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary h-12"
              />
              <Textarea
                placeholder="Nội dung cần liên hệ..."
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary min-h-[120px]"
              />

              <Button className="w-full h-12 text-lg font-bold uppercase tracking-wider bg-yellow-400 hover:bg-yellow-500 text-black rounded transition-colors shadow-lg shadow-yellow-400/20">
                Gửi Ngay
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
