export default defineEventHandler(() => {
    return {
      status: 'Backend is working!',
      time: new Date().toISOString()
    }
  })
  