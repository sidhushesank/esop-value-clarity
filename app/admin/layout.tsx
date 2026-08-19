import type { ReactNode } from "react";
import Link from "next/link";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        {/* ===================================================== */}
        {/* SIDEBAR                                               */}
        {/* ===================================================== */}

        <aside
          className="
            hidden
            w-64
            shrink-0
            border-r
            border-slate-200
            bg-white
            lg:flex
            lg:flex-col
          "
        >
          <div className="border-b border-slate-200 px-6 py-5">
            <Link
              href="/admin"
              className="
                text-lg
                font-black
                tracking-tight
                text-slate-950
              "
            >
              ESOP Value Clarity
            </Link>

            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Admin Console
            </p>
          </div>

          <nav className="flex-1 p-4">
            <div className="grid gap-1">
              <Link
                href="/admin"
                className="
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-100
                  hover:text-slate-950
                "
              >
                Overview
              </Link>

              <Link
                href="/admin/users"
                className="
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-100
                  hover:text-slate-950
                "
              >
                Users
              </Link>

              <Link
                href="/admin/activity"
                className="
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-100
                  hover:text-slate-950
                "
              >
                Activity
              </Link>

              <Link
                href="/admin/payments"
                className="
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-100
                  hover:text-slate-950
                "
              >
                Payments
              </Link>
            </div>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <Link
              href="/pro"
              className="
                block
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                text-center
                text-sm
                font-bold
                text-slate-700
                transition
                hover:bg-slate-50
              "
            >
              Back to Product
            </Link>
          </div>
        </aside>

        {/* ===================================================== */}
        {/* MAIN CONTENT                                          */}
        {/* ===================================================== */}

        <div className="min-w-0 flex-1">
          {/* =================================================== */}
          {/* MOBILE HEADER                                       */}
          {/* =================================================== */}

          <header
            className="
              sticky
              top-0
              z-40
              flex
              h-16
              items-center
              justify-between
              border-b
              border-slate-200
              bg-white/90
              px-4
              backdrop-blur-xl

              lg:px-6
            "
          >
            <div>
              <p className="text-sm font-black text-slate-950">
                Admin Dashboard
              </p>

              <p className="text-xs text-slate-500">
                ESOP Value Clarity
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/users"
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3
                  py-2
                  text-xs
                  font-bold
                  text-slate-700
                  shadow-sm
                  transition
                  hover:bg-slate-50

                  lg:hidden
                "
              >
                Users
              </Link>

              <Link
                href="/pro"
                className="
                  rounded-xl
                  bg-slate-950
                  px-3
                  py-2
                  text-xs
                  font-bold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-slate-800
                "
              >
                Product
              </Link>
            </div>
          </header>

          {/* =================================================== */}
          {/* PAGE CONTENT                                        */}
          {/* =================================================== */}

          <main
            className="
              mx-auto
              w-full
              max-w-[1600px]
              p-4

              sm:p-5
              lg:p-6
              xl:p-8
            "
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}