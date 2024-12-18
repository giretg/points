import PointsModel from '@/models/points-model';
import MainScreen from './content/mainscreen';

export const dynamic = 'force-dynamic'

const Home = async () => {
  const response = await PointsModel.find().sort({createdAt:-1});
  const pointObjects= JSON.parse(JSON.stringify(response));  

  console.log("pointObject:", pointObjects)

  return (
    <MainScreen pointObjects={pointObjects} />
  )
}

export default Home
