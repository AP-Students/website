

export default function Header({earnedPoints, totalPoints,}: {earnedPoints: number;totalPoints: number;}) {
  return (
    <header>
      {earnedPoints}/{totalPoints} Points Earned
    </header>
  );
}




export function Footer (haha: {haha: string;}){
    return(
        <>
        "HAHAHAAH" {haha}
        </>
    );
}



export function Layout ({haha, bla_bla}: {haha: any, bla_bla: any}){
    return(
        <>
        <Footer
            haha={haha}
            bla_bla = {bla_bla}
        />
        hahah
        </>
    )
}