import { NextRequest, NextResponse } from 'next/server';

// 在 Docker 環境中，使用服務名稱和正確的內部端口
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001/api';

async function proxyRequest(req: NextRequest, method: string, path: string[]) {
  let url = `${BACKEND_URL}/${path.join('/')}`;
  if (req.nextUrl.search) url += req.nextUrl.search;

  // 處理 multipart/form-data
  const contentType = req.headers.get('content-type') || '';
  // 擴充 RequestInit，可選擇加入 duplex 屬性
  const fetchOptions: RequestInit & { duplex?: 'half' } = {
    method,
    headers: { ...Object.fromEntries(req.headers.entries()) },
    // credentials: 'include', // 若有 cookie 可加
  };

  if (method !== 'GET' && method !== 'HEAD') {
    if (contentType.includes('multipart/form-data')) {
      // 直接轉發 body stream
      fetchOptions.body = req.body;
      // Node 18 需要 duplex: 'half' 來支援 ReadableStream
      fetchOptions.duplex = 'half';
    } else {
      const body = await req.text();
      fetchOptions.body = body;
    }
  }

  // 移除 host header，避免衝突
  if (fetchOptions.headers && typeof fetchOptions.headers === 'object' && 'host' in fetchOptions.headers) {
    delete (fetchOptions.headers as Record<string, string>)['host'];
  }

  try {
    const res = await fetch(url, fetchOptions);
    // 處理 buffer/stream 回傳
    const contentTypeRes = res.headers.get('content-type') || '';
    if (contentTypeRes.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } else {
      const buf = Buffer.from(await res.arrayBuffer());
      return new NextResponse(buf, {
        status: res.status,
        headers: res.headers,
      });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 503 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, 'GET', path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, 'POST', path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, 'PUT', path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, 'DELETE', path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, 'PATCH', path);
} 