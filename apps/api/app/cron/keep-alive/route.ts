export const GET = async () => {
  // Keep-alive endpoint - can add DB health check with getCollection if needed
  // const newPage = await database.page.create({
  //   data: {
  //     name: 'cron-temp',
  //   },
  // });

  // await database.page.delete({
  //   where: {
  //     id: newPage.id,
  //   },
  // });

  return new Response('OK', { status: 200 });
};
