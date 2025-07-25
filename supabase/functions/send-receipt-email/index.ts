import { serve } from 'https://deno.fresh.dev/std@v1.0.0/http/server.ts'

serve(async (req) => {
  try {
    // This function has been deprecated as email functionality has been removed
    const { pdfUrl } = await req.json()

    return new Response(JSON.stringify({
      message: 'Email functionality has been removed',
      info: 'This endpoint is deprecated and will be removed in a future update'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in deprecated email function:', error)
    return new Response(JSON.stringify({
      error: 'This email function is deprecated',
      info: 'Email functionality has been removed from the system'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
