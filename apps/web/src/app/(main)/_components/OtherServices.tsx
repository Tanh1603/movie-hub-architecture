import Link from 'next/link';

export default function OtherServices() {
  const services = [
    {
      name: 'NHÀ HÀNG',
      image:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop',
      href: '/services/dining',
    },
    {
      name: 'KIDZONE',
      image:
        'https://images.unsplash.com/photo-1498940757830-82f7813bf178?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      href: '/services/kids',
    },
    {
      name: 'BOWLING',
      image:
        'https://images.unsplash.com/photo-1614713568397-b31b779d0498?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Ym93bGluZ3xlbnwwfHwwfHx8MA%3D%3D',
      href: '/services/bowling',
    },
    {
      name: 'BILLIARDS',
      image:
        'https://images.unsplash.com/photo-1654338768506-53756875b028?q=80&w=1961&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      href: '/services/billiards',
    },
    {
      name: 'GYM & FITNESS',
      image:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
      href: '/services/gym',
    },
    {
      name: 'COFFEE',
      image:
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2574&auto=format&fit=crop',
      href: '/services/coffee',
    },
  ];

  return (
    <section className="px-6 w-full">
      <div className="flex flex-col items-center text-center mb-12 space-y-4">
        <span className="text-primary font-bold tracking-widest uppercase text-sm">
          Giải Trí Đa Dạng
        </span>
        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider">
          Dịch Vụ Giải Trí
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <p className="text-gray-400 max-w-2xl mx-auto">
          Không chỉ chiếu phim, chúng tôi còn mang đến những trải nghiệm giải
          trí đẳng cấp khác cho bạn và gia đình.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <Link
            href={s.href}
            key={i}
            className="group relative h-64 overflow-hidden rounded-2xl border border-white/10"
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${s.image})` }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 select-none">
              <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-2 group-hover:text-primary transition-colors">
                  {s.name}
                </h3>
                <div className="h-1 w-12 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </Link>
        ))}
      </div>
    </section>
  );
}
