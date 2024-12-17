import PointsModel from '@/models/points-model';
import MainScreen from './content/mainscreen';

export const dynamic = 'force-dynamic'

const Home = async () => {
  const response = await PointsModel.find().sort({createdAt:-1});
  const pointObject= JSON.parse(JSON.stringify(response));  

  console.log("pointObject:", pointObject)

  return (
    <MainScreen pointObject={pointObject[0]} />
  )
}

export default Home
