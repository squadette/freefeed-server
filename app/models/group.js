       {          }      '    '

       _      '      '

       {      }      '../      '
       {                    }      '../       /          '


                        (         ) {
  /**
   * @           
   * @            
   */
              =          (      ) {
        .   =       .  
        .      =       .     ;
        .         =       .        
        .           =       .          
        .            =       .            || ''
        .          =       .         
        .          =       .         
        .          =       .         
        .            =       .           
       (    .          === '1') {
          .            = '1'
    }
        .             =       .            
        .     = '     '
        .                   =       .                   || ''
  }

          (     ,     )

       .          =      
       .          = '    '

         .              (     .         , '        ', {
       :          () {            .        _ },
       :          (        ) {
         (        ) {
            .        _ =         .    ().           ();
      }
    }
  })

         .              (     .         , '          ', {
       :          () {            .          _ },
       :          (        ) {
         (_.        (        )) {
            .          _ =         .    ();
      }
    }
  })

         .              (     .         , '           ', {
       :          () {            .           _ },
       :          (        ) {
         (_.        (        )) {
            .           _ =         .    ();
      }
    }
  })

         .              (     .         , '            ', {
       :          () {            .            _ },
       :          (        ) {
          .            _ =          || '0'
    }
  })

       .         .                =          (    _        ) {
                =     .        
        &&     .        .       >= 3   //         
        &&     .        .       <= 35  //                           
        &&     .        .     (/^  -  - 0-9 +(-  -  - 0-9 +)*$/)
        && !    .        (    _        ).        (    .        )

                
  }

       .         .         =          (    _        ) {
       (!    .               (    _        )) {
                     ('                ')
    }

       (!    .                 ()) {
                     (`"${    .          }"                            .                       3     25                .`)
    }

       (!    .                  ()) {
                     ('                       ')
    }
  }

       .         .       =                (       ,     _        ) {
        .          =         ().       ()
        .          =         ().       ()
        .           =     .           ||     .        

              .                (    _        )

                  = {
      '        ':         .        ,
      '          ':       .          ,
      '           ':      .           ,
      '    ':             .    ,
      '         ':        .         .        (),
      '         ':        .         .        (),
      '         ':        .         ,
      '           ':      .           ,
      '            ':     .            
    };
         .  ,     .       =                .          (       );

                   .                   (    .  ,  '           ', '     ', '        ', '     ', '     ' )

       (       ) {
                .                (       )
                .              (       )
    }

               
  }

       .         .       =                (      ) {
                   =      

       (      .              ('          ') &&     .           !=       .          ) {
         (!    .                 (      .          )) {
                       (`"${      .          }"                            .                       3     25                .`)
      }

          .           =       .          
                 =     
    }

       (      .              ('           ') &&       .            !=     .           ) {
         (!    .                  (      .           )) {
                       ('                       ')
      }

          .            =       .           
                 =     
    }

       (      .              ('         ') &&       .          !=     .         ) {
          .          =       .         
                 =     
    }

    //                       -                   :
    //                                                                                
       (      .              ('         ') && (!      .              ('           ') ||       .          === '1')) {
            .            =       .         
    }

       (      .              ('           ') &&       .            !=     .           ) {
          .            =       .           
                 =     
    }

       (      .              ('            ') &&       .             !=     .            ) {
          .             =       .            
                 =     
    }

       (          ) {
          .          =         ().       ()

                    = {
        '          ':       .          ,
        '           ':      .           ,
        '         ':        .         .        (),
        '         ':        .         ,
        '           ':      .           ,
        '            ':     .            
      }

                     .          (    .  ,        )
    }

               
  }

       .         .               =                (       ) {
                =                .           (       )

       (!     ) {
                 
    }

                     =           .                  ()
              =            .           (          )

              
  }

       .         .                 =          (      ) {
                    .                       (    .  ,       )
  }

       .         .                    =                (      ) {
                   =           .                   ()

       (!        .        (      )) {
                     ('                    ')
    }

       (        .       == 1) {
                     ('                                ')
    }

                    .                            (    .  ,       )
  }

       .         .                    =                () {
        .                 =                .                         (    .  )
               .                
  }

       .         .                  =                () {
                   =           .                   ()
        .               =                .             (        )

               .              
  }

  /**
   *                                                                    .
   */
       .         .                =                (           ) {
                   =           .                ()
              =               .                ()

       (!   .        (           .  )) {
                                  ("       '                                   '            ")
    }

       (    .             === '1') {
                     =           .                   ()
         (!        .        (           .  )) {
                                    ("       '                            ")
      }
    }
  }

              
}
